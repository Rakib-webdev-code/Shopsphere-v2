import { jsonResponse } from "@/lib/api";
import { handleStripeEvent } from "@/lib/services/payments";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

/**
 * Stripe calls this endpoint after a payment. The signature is verified against
 * the raw request body, so only Stripe can mark an order as paid.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonResponse({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return jsonResponse({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("[stripe] webhook handler failed", event.type, error);
    // A 500 makes Stripe retry the event later.
    return jsonResponse({ error: "Webhook handler failed." }, { status: 500 });
  }

  return jsonResponse({ received: true });
}
