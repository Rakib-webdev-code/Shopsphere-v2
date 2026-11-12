import { ObjectId } from "mongodb";
import {
  ordersCollection,
  productsCollection,
  reviewsCollection,
  usersCollection,
} from "@/lib/db/collections";
import type { OrderDoc } from "@/lib/db/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, OrderSummary } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

export type ActivityKind =
  | "order_placed"
  | "order_status"
  | "payment"
  | "review";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: string;
  href: string | null;
};

export type MonthBucket = { key: string; label: string; cents: number };
export type DayBucket = {
  key: string;
  label: string;
  cents: number;
  orders: number;
};

function userFilter(id: string) {
  return ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { _id: id as unknown as ObjectId };
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Last `count` calendar months (UTC), oldest first, all with zero cents. */
export function buildMonthBuckets(now: Date, count = 6): MonthBucket[] {
  const buckets: MonthBucket[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    buckets.push({
      key: `${date.getUTCFullYear()}-${month}`,
      label: MONTH_LABELS[date.getUTCMonth()],
      cents: 0,
    });
  }

  return buckets;
}

/** Last `count` days (UTC), oldest first, zero filled. */
export function buildDayBuckets(now: Date, count: number): DayBucket[] {
  const buckets: DayBucket[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - offset,
      ),
    );
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    buckets.push({
      key: `${date.getUTCFullYear()}-${month}-${day}`,
      label: `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}`,
      cents: 0,
      orders: 0,
    });
  }

  return buckets;
}

/**
 * Turns order documents into an activity feed: one "placed" event, one event
 * per status change after the first, and one for a confirmed payment. Only
 * facts stored on the order are used, so nothing is invented.
 */
export function buildOrderActivity(
  orders: Pick<
    OrderDoc,
    "_id" | "orderNumber" | "createdAt" | "statusHistory" | "paidAt" | "status"
  >[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const order of orders) {
    const id = order._id.toHexString();
    const href = `/account/orders/${id}`;

    items.push({
      id: `${id}:placed`,
      kind: "order_placed",
      title: `Order ${order.orderNumber} placed`,
      detail: "We received your order.",
      at: order.createdAt.toISOString(),
      href,
    });

    const history = [...(order.statusHistory ?? [])].sort(
      (a, b) => a.changedAt.getTime() - b.changedAt.getTime(),
    );

    history.forEach((event, index) => {
      // The first "pending" event is the order being placed.
      if (index === 0 && event.status === "pending") {
        return;
      }

      items.push({
        id: `${id}:status:${index}`,
        kind: "order_status",
        title: `Order ${order.orderNumber} is ${ORDER_STATUS_LABELS[
          event.status
        ].toLowerCase()}`,
        detail: `Status changed to ${ORDER_STATUS_LABELS[event.status]}.`,
        at: event.changedAt.toISOString(),
        href,
      });
    });

    if (order.paidAt) {
      items.push({
        id: `${id}:paid`,
        kind: "payment",
        title: `Payment received for ${order.orderNumber}`,
        detail: "Your card payment was confirmed.",
        at: order.paidAt.toISOString(),
        href,
      });
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/* -------------------------------------------------------------------------- */
/* Customer dashboard                                                         */
/* -------------------------------------------------------------------------- */

export type CustomerOrderTotals = {
  totalOrders: number;
  /** Sum of quantities across orders that were not cancelled. */
  itemsPurchased: number;
  /** Sum of totals for orders whose payment is confirmed (`paid`). */
  paidSpendCents: number;
  paidOrders: number;
  byStatus: Record<OrderStatus, number>;
};

export type RecentProduct = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  priceInCents: number;
  orderedAt: string;
};

export type CustomerDashboard = {
  totals: CustomerOrderTotals;
  recentOrders: OrderSummary[];
  recentProducts: RecentProduct[];
  spendByMonth: MonthBucket[];
  activity: ActivityItem[];
};

function emptyStatusCounts(): Record<OrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
}

export async function getCustomerOrderTotals(
  userId: string,
): Promise<CustomerOrderTotals> {
  const rows = await ordersCollection
    .aggregate<{
      _id: OrderStatus;
      count: number;
      items: number;
      paidCents: number;
      paidCount: number;
    }>([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          items: { $sum: { $sum: "$items.quantity" } },
          paidCents: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalCents", 0],
            },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  const byStatus = emptyStatusCounts();
  let totalOrders = 0;
  let itemsPurchased = 0;
  let paidSpendCents = 0;
  let paidOrders = 0;

  for (const row of rows) {
    if (row._id in byStatus) {
      byStatus[row._id] = row.count;
    }

    totalOrders += row.count;
    paidSpendCents += row.paidCents;
    paidOrders += row.paidCount;

    if (row._id !== "cancelled") {
      itemsPurchased += row.items;
    }
  }

  return { totalOrders, itemsPurchased, paidSpendCents, paidOrders, byStatus };
}

export async function getCustomerSpendByMonth(
  userId: string,
  now = new Date(),
  months = 6,
): Promise<MonthBucket[]> {
  const buckets = buildMonthBuckets(now, months);
  const first = buckets[0].key.split("-").map(Number);
  const since = new Date(Date.UTC(first[0], first[1] - 1, 1));
  const rows = await ordersCollection
    .aggregate<{ _id: string; cents: number }>([
      { $match: { userId, paymentStatus: "paid" } },
      {
        $addFields: {
          spentAt: { $ifNull: ["$paidAt", "$createdAt"] },
        },
      },
      { $match: { spentAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$spentAt" } },
          cents: { $sum: "$totalCents" },
        },
      },
    ])
    .toArray();
  const byKey = new Map(rows.map((row) => [row._id, row.cents]));

  return buckets.map((bucket) => ({
    ...bucket,
    cents: byKey.get(bucket.key) ?? 0,
  }));
}

async function listCustomerActivity(
  userId: string,
  limit: number,
): Promise<ActivityItem[]> {
  const [orders, reviews] = await Promise.all([
    ordersCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(25)
      .toArray(),
    reviewsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
  ]);
  const products = reviews.length
    ? await productsCollection
        .find(
          { _id: { $in: reviews.map((review) => review.productId) } },
          { projection: { name: 1, slug: 1 } },
        )
        .toArray()
    : [];
  const productMap = new Map(
    products.map((product) => [product._id.toHexString(), product]),
  );
  const reviewItems: ActivityItem[] = reviews.map((review) => {
    const product = productMap.get(review.productId.toHexString());

    return {
      id: `${review._id.toHexString()}:review`,
      kind: "review",
      title: product
        ? `You reviewed ${product.name}`
        : "You posted a review",
      detail: `${review.rating} out of 5 stars.`,
      at: review.createdAt.toISOString(),
      href: product ? `/shop/${product.slug}` : null,
    };
  });

  return [...buildOrderActivity(orders), ...reviewItems]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

export async function getCustomerDashboard(
  userId: string,
  now = new Date(),
): Promise<CustomerDashboard> {
  const [totals, spendByMonth, recentDocs, activity] = await Promise.all([
    getCustomerOrderTotals(userId),
    getCustomerSpendByMonth(userId, now),
    ordersCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    listCustomerActivity(userId, 8),
  ]);

  const recentOrders: OrderSummary[] = recentDocs.slice(0, 5).map((order) => ({
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: order.totalCents,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
  }));

  const seen = new Set<string>();
  const recentProducts: RecentProduct[] = [];

  for (const order of recentDocs) {
    if (order.status === "cancelled") {
      continue;
    }

    for (const item of order.items) {
      const key = item.productId.toHexString();

      if (seen.has(key) || recentProducts.length >= 6) {
        continue;
      }

      seen.add(key);
      recentProducts.push({
        productId: key,
        slug: item.slug,
        name: item.name,
        image: item.image,
        priceInCents: item.priceInCents,
        orderedAt: order.createdAt.toISOString(),
      });
    }
  }

  return { totals, recentOrders, recentProducts, spendByMonth, activity };
}

export type CustomerNotifications = {
  items: (ActivityItem & { unread: boolean })[];
  unreadCount: number;
};

export async function getCustomerNotifications(
  userId: string,
  limit = 40,
): Promise<CustomerNotifications> {
  const [activity, user] = await Promise.all([
    listCustomerActivity(userId, limit),
    usersCollection.findOne(userFilter(userId), {
      projection: { notificationsSeenAt: 1 },
    }),
  ]);
  const seenAt = user?.notificationsSeenAt?.toISOString() ?? null;
  const items = activity.map((item) => ({
    ...item,
    unread: seenAt === null || item.at > seenAt,
  }));

  return {
    items,
    unreadCount: items.filter((item) => item.unread).length,
  };
}

/** Lightweight count for the header bell. */
export async function countUnreadCustomerNotifications(userId: string) {
  const { unreadCount } = await getCustomerNotifications(userId, 40);
  return unreadCount;
}

export async function markNotificationsSeen(userId: string) {
  await usersCollection.updateOne(userFilter(userId), {
    $set: { notificationsSeenAt: new Date() },
  });
}

/* -------------------------------------------------------------------------- */
/* Customer reviews                                                           */
/* -------------------------------------------------------------------------- */

export type CustomerReviewRow = {
  id: string;
  productName: string;
  productSlug: string | null;
  productImage: string | null;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

export async function listReviewsForCustomer(
  userId: string,
): Promise<CustomerReviewRow[]> {
  const reviews = await reviewsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  if (reviews.length === 0) {
    return [];
  }

  const products = await productsCollection
    .find({ _id: { $in: reviews.map((review) => review.productId) } })
    .toArray();
  const productMap = new Map(
    products.map((product) => [product._id.toHexString(), product]),
  );

  return reviews.map((review) => {
    const product = productMap.get(review.productId.toHexString());

    return {
      id: review._id.toHexString(),
      productName: product?.name ?? "Product no longer available",
      productSlug: product?.active ? product.slug : null,
      productImage: product?.images[0] ?? null,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedPurchase: Boolean(review.verifiedPurchase),
      createdAt: review.createdAt.toISOString(),
    };
  });
}
