import type Stripe from "stripe";
import { ObjectId } from "mongodb";
import { ordersCollection } from "@/lib/db/collections";
import type { OrderDoc } from "@/lib/db/types";
import { conflict, notFound } from "@/lib/errors";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { parseObjectId } from "@/lib/validation";

const CURRENCY = "usd";

/**
 * Creates a hosted Stripe Checkout session for an existing, unpaid order.
 *
 * The order (prices, stock, coupon, shipping) is already validated and stored
 * by `createOrder`; this function only re-uses those stored amounts, so a
 * tampered browser request can never change what the customer is charged.
 */
export async function createCheckoutSessionForOrder(
  userId: string,
  orderId: string,
  appUrl: string,
) {
  if (!isStripeConfigured()) {
    throw conflict("Card payments are not enabled on this store.");
  }

  const id = parseObjectId(orderId, "Order ID");
  const order = await ordersCollection.findOne({ _id: id, userId });

  if (!order) {
    throw notFound("Order not found.");
  }

  if (order.paymentStatus === "paid") {
    throw conflict("This order is already paid.");
  }

  if (order.status === "cancelled" || order.inventoryState !== "reserved") {
    throw conflict("This order can no longer be paid.");
  }

  const stripe = getStripe();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: CURRENCY,
        unit_amount: item.priceInCents,
        product_data: { name: item.name },
      },
    }));

  if (order.shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: order.shippingCents,
        product_data: { name: "Shipping" },
      },
    });
  }

  // Stripe line items cannot be negative, so a coupon discount is sent as a
  // one-off Stripe coupon for the exact amount stored on the order.
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

  if (order.discountCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: order.discountCents,
      currency: CURRENCY,
      duration: "once",
      name: order.couponCode ?? "Discount",
    });
    discounts.push({ coupon: coupon.id });
  }

  const orderPath = `/account/orders/${order._id.toHexString()}`;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: lineItems,
      discounts,
      customer_email: order.customerEmail,
      client_reference_id: order._id.toHexString(),
      metadata: {
        orderId: order._id.toHexString(),
        orderNumber: order.orderNumber,
      },
      payment_intent_data: {
        metadata: { orderId: order._id.toHexString() },
      },
      success_url: `${appUrl}${orderPath}?paid=1`,
      cancel_url: `${appUrl}${orderPath}?payment=cancelled`,
    },
    // The same order always maps to the same key for a short window, so a
    // double click cannot create two sessions with different amounts.
    { idempotencyKey: `order-${order._id.toHexString()}-${order.totalCents}` },
  );

  await ordersCollection.updateOne(
    { _id: order._id, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentMethod: "card",
        stripeSessionId: session.id,
        updatedAt: new Date(),
      },
    },
  );

  if (!session.url) {
    throw conflict("Stripe did not return a payment link. Try again.");
  }

  return { url: session.url };
}

function orderIdFromSession(session: Stripe.Checkout.Session) {
  const raw = session.metadata?.orderId ?? session.client_reference_id;
  return raw && ObjectId.isValid(raw) ? new ObjectId(raw) : null;
}

/**
 * Applies a verified Stripe webhook event. Every update is conditional, so
 * Stripe retrying the same event (which it does) never changes anything twice.
 */
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = orderIdFromSession(session);

      if (!orderId || session.payment_status !== "paid") {
        return;
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await ordersCollection.updateOne(
        { _id: orderId, paymentStatus: { $in: ["unpaid", "failed"] } },
        {
          $set: {
            paymentStatus: "paid",
            paymentMethod: "card",
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
      return;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = orderIdFromSession(session);

      if (orderId) {
        await ordersCollection.updateOne(
          { _id: orderId, paymentStatus: "unpaid" },
          { $set: { paymentStatus: "failed", updatedAt: new Date() } },
        );
      }
      return;
    }

    default:
      return;
  }
}

/**
 * Refunds a card payment in full when an admin cancels a paid order.
 * Safe to call for any order: unpaid, pay-later, and already refunded orders
 * are ignored.
 */
export async function refundOrderIfPaid(order: Pick<OrderDoc, "_id">) {
  if (!isStripeConfigured()) {
    return false;
  }

  const current = await ordersCollection.findOne({ _id: order._id });

  if (
    !current ||
    current.paymentStatus !== "paid" ||
    !current.stripePaymentIntentId
  ) {
    return false;
  }

  await getStripe().refunds.create(
    { payment_intent: current.stripePaymentIntentId },
    { idempotencyKey: `refund-${current._id.toHexString()}` },
  );

  await ordersCollection.updateOne(
    { _id: current._id, paymentStatus: "paid" },
    {
      $set: {
        paymentStatus: "refunded",
        refundedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return true;
}
