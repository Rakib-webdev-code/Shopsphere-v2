import {
  inventoryAdjustmentsCollection,
  ordersCollection,
  productsCollection,
  reviewsCollection,
  usersCollection,
} from "@/lib/db/collections";
import { LOW_STOCK_THRESHOLD, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  buildDayBuckets,
  type DayBucket,
} from "@/lib/services/dashboard";
import type { OrderStatus } from "@/lib/types";

export type AdminAnalytics = {
  days: number;
  revenueByDay: DayBucket[];
  /** Paid revenue inside the window (paymentStatus === "paid" only). */
  paidRevenueCents: number;
  paidOrders: number;
  averagePaidOrderCents: number;
  ordersInRange: number;
  newCustomers: number;
  statusBreakdown: { status: OrderStatus; label: string; count: number }[];
  paymentMix: { card: number; payLater: number; paid: number; unpaid: number };
  bestSellers: {
    productId: string;
    name: string;
    slug: string;
    image: string | null;
    units: number;
    orderValueCents: number;
  }[];
};

export const ANALYTICS_RANGES = [7, 30, 90] as const;

export function parseAnalyticsRange(value: string | undefined): number {
  const parsed = Number(value);
  return (ANALYTICS_RANGES as readonly number[]).includes(parsed)
    ? parsed
    : 30;
}

export async function getAdminAnalytics(
  days: number,
  now = new Date(),
): Promise<AdminAnalytics> {
  const buckets = buildDayBuckets(now, days);
  const [y, m, d] = buckets[0].key.split("-").map(Number);
  const since = new Date(Date.UTC(y, m - 1, d));

  const [paidRows, createdRows, statusRows, mixRows, sellerRows, newCustomers] =
    await Promise.all([
      ordersCollection
        .aggregate<{ _id: string; cents: number; count: number }>([
          { $match: { paymentStatus: "paid" } },
          { $addFields: { paidOn: { $ifNull: ["$paidAt", "$createdAt"] } } },
          { $match: { paidOn: { $gte: since } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidOn" } },
              cents: { $sum: "$totalCents" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      ordersCollection
        .aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: since } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      ordersCollection
        .aggregate<{ _id: OrderStatus; count: number }>([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),
      ordersCollection
        .aggregate<{
          _id: null;
          card: number;
          payLater: number;
          paid: number;
          unpaid: number;
        }>([
          { $match: { createdAt: { $gte: since } } },
          {
            $group: {
              _id: null,
              card: {
                $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, 1, 0] },
              },
              payLater: {
                $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, 0, 1] },
              },
              paid: {
                $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
              },
              unpaid: {
                $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 0, 1] },
              },
            },
          },
        ])
        .toArray(),
      ordersCollection
        .aggregate<{
          _id: import("mongodb").ObjectId;
          name: string;
          slug: string;
          image: string | null;
          units: number;
          value: number;
        }>([
          {
            $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              name: { $first: "$items.name" },
              slug: { $first: "$items.slug" },
              image: { $first: "$items.image" },
              units: { $sum: "$items.quantity" },
              value: { $sum: "$items.lineTotalCents" },
            },
          },
          { $sort: { units: -1, value: -1 } },
          { $limit: 8 },
        ])
        .toArray(),
      usersCollection.countDocuments({
        role: { $ne: "admin" },
        createdAt: { $gte: since },
      }),
    ]);

  const paidByDay = new Map(paidRows.map((row) => [row._id, row]));
  const createdByDay = new Map(createdRows.map((row) => [row._id, row.count]));
  const revenueByDay = buckets.map((bucket) => ({
    ...bucket,
    cents: paidByDay.get(bucket.key)?.cents ?? 0,
    orders: createdByDay.get(bucket.key) ?? 0,
  }));
  const paidRevenueCents = paidRows.reduce((sum, row) => sum + row.cents, 0);
  const paidOrders = paidRows.reduce((sum, row) => sum + row.count, 0);
  const statusMap = new Map(statusRows.map((row) => [row._id, row.count]));
  const mix = mixRows[0];

  return {
    days,
    revenueByDay,
    paidRevenueCents,
    paidOrders,
    averagePaidOrderCents:
      paidOrders > 0 ? Math.round(paidRevenueCents / paidOrders) : 0,
    ordersInRange: createdRows.reduce((sum, row) => sum + row.count, 0),
    newCustomers,
    statusBreakdown: (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
      (status) => ({
        status,
        label: ORDER_STATUS_LABELS[status],
        count: statusMap.get(status) ?? 0,
      }),
    ),
    paymentMix: {
      card: mix?.card ?? 0,
      payLater: mix?.payLater ?? 0,
      paid: mix?.paid ?? 0,
      unpaid: mix?.unpaid ?? 0,
    },
    bestSellers: sellerRows.map((row) => ({
      productId: row._id.toHexString(),
      name: row.name,
      slug: row.slug,
      image: row.image,
      units: row.units,
      orderValueCents: row.value,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Recent activity                                                            */
/* -------------------------------------------------------------------------- */

export type AdminActivityItem = {
  id: string;
  kind: "order" | "customer" | "stock" | "review";
  title: string;
  detail: string;
  at: string;
  href: string | null;
};

export async function getAdminActivity(
  limit = 10,
): Promise<AdminActivityItem[]> {
  const [orders, customers, adjustments, reviews] = await Promise.all([
    ordersCollection.find({}).sort({ createdAt: -1 }).limit(6).toArray(),
    usersCollection
      .find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray(),
    inventoryAdjustmentsCollection
      .find({})
      .sort({ at: -1 })
      .limit(4)
      .toArray(),
    reviewsCollection.find({}).sort({ createdAt: -1 }).limit(4).toArray(),
  ]);
  const adjustedProducts = adjustments.length
    ? await productsCollection
        .find(
          { _id: { $in: adjustments.map((entry) => entry.productId) } },
          { projection: { name: 1 } },
        )
        .toArray()
    : [];
  const productName = new Map(
    adjustedProducts.map((product) => [product._id.toHexString(), product.name]),
  );
  const items: AdminActivityItem[] = [
    ...orders.map((order) => ({
      id: `order:${order._id.toHexString()}`,
      kind: "order" as const,
      title: `Order ${order.orderNumber}`,
      detail: `${order.customerEmail} · ${ORDER_STATUS_LABELS[order.status]} · ${order.paymentStatus}`,
      at: order.createdAt.toISOString(),
      href: `/admin/orders/${order._id.toHexString()}`,
    })),
    ...customers.map((user) => ({
      id: `user:${user._id.toHexString()}`,
      kind: "customer" as const,
      title: `${user.name} joined`,
      detail: user.email,
      at: user.createdAt.toISOString(),
      href: "/admin/customers",
    })),
    ...adjustments.map((entry) => ({
      id: `stock:${entry._id.toHexString()}`,
      kind: "stock" as const,
      title: `Stock ${entry.delta >= 0 ? "+" : ""}${entry.delta} · ${
        productName.get(entry.productId.toHexString()) ?? "Product"
      }`,
      detail: `${entry.beforeStock} → ${entry.afterStock}. ${entry.reason}`,
      at: entry.at.toISOString(),
      href: "/admin/inventory",
    })),
    ...reviews.map((review) => ({
      id: `review:${review._id.toHexString()}`,
      kind: "review" as const,
      title: `${review.authorName} left ${review.rating} stars`,
      detail: review.title || review.body.slice(0, 80),
      at: review.createdAt.toISOString(),
      href: "/admin/reviews",
    })),
  ];

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Alerts (admin notifications)                                               */
/* -------------------------------------------------------------------------- */

export type AdminAlerts = {
  pendingOrders: { id: string; orderNumber: string; at: string }[];
  pendingOrderCount: number;
  reconciliation: { id: string; orderNumber: string; error: string | null }[];
  lowStock: { id: string; name: string; stock: number }[];
  lowStockCount: number;
  recentReviews: { id: string; author: string; rating: number; at: string }[];
  newCustomers7d: number;
};

export async function getAdminAlerts(now = new Date()): Promise<AdminAlerts> {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [
    pending,
    pendingOrderCount,
    reconciliation,
    lowStock,
    lowStockCount,
    reviews,
    newCustomers7d,
  ] = await Promise.all([
    ordersCollection
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    ordersCollection.countDocuments({ status: "pending" }),
    ordersCollection
      .find({
        reconciliationRequired: true,
        reconciliationResolvedAt: { $in: [null, undefined] },
      })
      .limit(10)
      .toArray(),
    productsCollection
      .find({ active: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, name: 1 })
      .limit(8)
      .toArray(),
    productsCollection.countDocuments({
      active: true,
      stock: { $lte: LOW_STOCK_THRESHOLD },
    }),
    reviewsCollection
      .find({ createdAt: { $gte: weekAgo } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    usersCollection.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: weekAgo },
    }),
  ]);

  return {
    pendingOrders: pending.map((order) => ({
      id: order._id.toHexString(),
      orderNumber: order.orderNumber,
      at: order.createdAt.toISOString(),
    })),
    pendingOrderCount,
    reconciliation: reconciliation.map((order) => ({
      id: order._id.toHexString(),
      orderNumber: order.orderNumber,
      error: order.reconciliationError ?? null,
    })),
    lowStock: lowStock.map((product) => ({
      id: product._id.toHexString(),
      name: product.name,
      stock: product.stock,
    })),
    lowStockCount,
    recentReviews: reviews.map((review) => ({
      id: review._id.toHexString(),
      author: review.authorName,
      rating: review.rating,
      at: review.createdAt.toISOString(),
    })),
    newCustomers7d,
  };
}

/** Count of items that currently need an admin's attention (header bell). */
export async function countAdminAttention(): Promise<number> {
  const [pending, reconciliation, lowStock] = await Promise.all([
    ordersCollection.countDocuments({ status: "pending" }),
    ordersCollection.countDocuments({
      reconciliationRequired: true,
      reconciliationResolvedAt: { $in: [null, undefined] },
    }),
    productsCollection.countDocuments({
      active: true,
      stock: { $lte: LOW_STOCK_THRESHOLD },
    }),
  ]);

  return pending + reconciliation + lowStock;
}

/* -------------------------------------------------------------------------- */
/* Reviews & promotions                                                       */
/* -------------------------------------------------------------------------- */

export type AdminReviewRow = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  productName: string;
  productSlug: string | null;
  createdAt: string;
};

export async function listReviewsForAdmin(
  maxRating?: number,
): Promise<{ rows: AdminReviewRow[]; total: number; average: number }> {
  const filter = maxRating ? { rating: { $lte: maxRating } } : {};
  const [reviews, total, avg] = await Promise.all([
    reviewsCollection.find(filter).sort({ createdAt: -1 }).limit(60).toArray(),
    reviewsCollection.countDocuments({}),
    reviewsCollection
      .aggregate<{ _id: null; avg: number }>([
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ])
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

  return {
    total,
    average: avg[0]?.avg ?? 0,
    rows: reviews.map((review) => {
      const product = productMap.get(review.productId.toHexString());

      return {
        id: review._id.toHexString(),
        author: review.authorName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        verifiedPurchase: Boolean(review.verifiedPurchase),
        productName: product?.name ?? "Deleted product",
        productSlug: product?.slug ?? null,
        createdAt: review.createdAt.toISOString(),
      };
    }),
  };
}

export type PromotionProduct = {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  compareAtPriceInCents: number;
  badge: string | null;
};

export async function listPromotionProducts(): Promise<PromotionProduct[]> {
  const products = await productsCollection
    .find({ active: true, compareAtPriceInCents: { $ne: null } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return products
    .filter(
      (product) =>
        product.compareAtPriceInCents !== null &&
        product.compareAtPriceInCents > product.priceInCents,
    )
    .map((product) => ({
      id: product._id.toHexString(),
      name: product.name,
      slug: product.slug,
      priceInCents: product.priceInCents,
      compareAtPriceInCents: product.compareAtPriceInCents as number,
      badge: product.badge,
    }));
}
