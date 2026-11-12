import assert from "node:assert/strict";
import test, { after } from "node:test";
import { ObjectId } from "mongodb";
import {
  assertIsolatedDatabase,
  configureTestDatabase,
  dropTestDatabase,
} from "./support/test-db.mjs";

const testDbName = configureTestDatabase();
const hasMongo = Boolean(testDbName);
const dbTest = hasMongo ? test : test.skip;

let db;
let mongoClient;
let collections;
let dashboard;
let insights;
let avatars;

if (hasMongo) {
  const mongodb = await import("../src/lib/mongodb.ts");
  db = mongodb.db;
  mongoClient = mongodb.mongoClient;
  assertIsolatedDatabase(db.databaseName);
  collections = await import("../src/lib/db/collections.ts");
  dashboard = await import("../src/lib/services/dashboard.ts");
  insights = await import("../src/lib/services/admin-insights.ts");
  avatars = await import("../src/lib/services/avatar.ts");
}

after(async () => {
  if (hasMongo) {
    await dropTestDatabase(db, testDbName);
    await mongoClient.close();
  }
});

const NOW = new Date("2026-11-12T12:00:00Z");
const productA = new ObjectId();
const productB = new ObjectId();

function line(productId, name, quantity, price) {
  return {
    productId,
    name,
    slug: name.toLowerCase(),
    image: null,
    priceInCents: price,
    quantity,
    lineTotalCents: quantity * price,
  };
}

function order(userId, number, status, paymentStatus, items, at, extra = {}) {
  const total = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return {
    _id: new ObjectId(),
    orderNumber: number,
    userId,
    customerEmail: `${userId}@example.test`,
    status,
    paymentStatus,
    paymentMethod: paymentStatus === "paid" ? "card" : "pay-later",
    items,
    totalCents: total,
    subtotalCents: total,
    createdAt: at,
    updatedAt: at,
    paidAt: paymentStatus === "paid" ? at : null,
    statusHistory: [{ status: "pending", changedAt: at }],
    ...extra,
  };
}

async function seed() {
  const alice = "user-alice";
  const bob = "user-bob";
  await collections.ordersCollection.insertMany([
    // Alice: paid+delivered, unpaid pending, cancelled paid->refunded, paid shipped.
    order(alice, "A-1", "delivered", "paid", [line(productA, "Alpha", 2, 1000)], new Date("2026-11-03T10:00:00Z")),
    order(alice, "A-2", "pending", "unpaid", [line(productB, "Beta", 3, 500)], new Date("2026-11-10T10:00:00Z")),
    order(alice, "A-3", "cancelled", "refunded", [line(productA, "Alpha", 5, 1000)], new Date("2026-10-20T10:00:00Z")),
    order(alice, "A-4", "shipped", "paid", [line(productB, "Beta", 1, 2500)], new Date("2026-09-15T10:00:00Z")),
    order(alice, "A-5", "processing", "unpaid", [line(productA, "Alpha", 1, 1000)], new Date("2026-11-11T10:00:00Z")),
    // Bob's orders must never leak into Alice's numbers.
    order(bob, "B-1", "delivered", "paid", [line(productA, "Alpha", 10, 1000)], new Date("2026-11-05T10:00:00Z")),
  ]);
}

dbTest("customer totals count paid spend only, exclude cancelled items, and isolate users", async () => {
  await seed();
  const totals = await dashboard.getCustomerOrderTotals("user-alice");

  assert.equal(totals.totalOrders, 5);
  // Unpaid pending (3) and processing (1) orders still count as ordered items;
  // the cancelled order's 5 units do not.
  assert.equal(totals.itemsPurchased, 2 + 3 + 1 + 1);
  // Only A-1 (2000) and A-4 (2500) are paid; refunded and unpaid are excluded.
  assert.equal(totals.paidSpendCents, 4500);
  assert.equal(totals.paidOrders, 2);
  assert.deepEqual(totals.byStatus, {
    pending: 1,
    confirmed: 0,
    processing: 1,
    shipped: 1,
    delivered: 1,
    cancelled: 1,
  });

  const bob = await dashboard.getCustomerOrderTotals("user-bob");
  assert.equal(bob.totalOrders, 1);
  assert.equal(bob.paidSpendCents, 10000);

  const nobody = await dashboard.getCustomerOrderTotals("user-nobody");
  assert.equal(nobody.totalOrders, 0);
  assert.equal(nobody.paidSpendCents, 0);
  assert.equal(nobody.itemsPurchased, 0);
});

dbTest("customer spend by month buckets only paid orders", async () => {
  const months = await dashboard.getCustomerSpendByMonth("user-alice", NOW, 3);
  assert.deepEqual(months.map((m) => m.key), ["2026-09", "2026-10", "2026-11"]);
  assert.deepEqual(months.map((m) => m.cents), [2500, 0, 2000]);
});

dbTest("customer dashboard lists recent orders, distinct non-cancelled products and activity", async () => {
  const data = await dashboard.getCustomerDashboard("user-alice", NOW);
  assert.equal(data.recentOrders[0].orderNumber, "A-5");
  assert.equal(data.recentOrders.length, 5);
  assert.deepEqual(
    data.recentProducts.map((p) => p.name).sort(),
    ["Alpha", "Beta"],
  );
  assert.ok(data.activity.length > 0);
  assert.ok(data.activity.every((item) => !item.title.includes("B-1")));
});

dbTest("notifications are unread until marked seen", async () => {
  const userId = new ObjectId();
  await collections.usersCollection.insertOne({
    _id: userId,
    name: "Notify",
    email: "notify@example.test",
    emailVerified: true,
    role: "customer",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const id = userId.toHexString();
  await collections.ordersCollection.insertOne(
    order(id, "N-1", "pending", "unpaid", [line(productA, "Alpha", 1, 1000)], new Date()),
  );

  const before = await dashboard.getCustomerNotifications(id);
  assert.ok(before.unreadCount >= 1);
  await dashboard.markNotificationsSeen(id);
  const after = await dashboard.getCustomerNotifications(id);
  assert.equal(after.unreadCount, 0);
  assert.equal(after.items.length, before.items.length);

  // Keep this fixture out of the analytics assertions below.
  await collections.ordersCollection.deleteMany({ userId: id });
});

dbTest("admin analytics never counts unpaid orders as revenue and ranks best sellers", async () => {
  const data = await insights.getAdminAnalytics(30, NOW);
  // Paid inside the last 30 days: A-1 (2000) + B-1 (10000). A-4 is September.
  assert.equal(data.paidRevenueCents, 12000);
  assert.equal(data.paidOrders, 2);
  assert.equal(data.averagePaidOrderCents, 6000);
  assert.equal(data.revenueByDay.length, 30);
  assert.equal(
    data.revenueByDay.reduce((sum, day) => sum + day.cents, 0),
    12000,
  );
  assert.equal(data.bestSellers[0].name, "Alpha");
  // Alpha units in non-cancelled orders in range: 2 + 1 + 10; cancelled 5 excluded.
  assert.equal(data.bestSellers[0].units, 13);
  const pending = data.statusBreakdown.find((s) => s.status === "pending");
  assert.equal(pending.count, 1);
});

dbTest("analytics range parsing falls back to 30 days", () => {
  assert.equal(insights.parseAnalyticsRange("7"), 7);
  assert.equal(insights.parseAnalyticsRange("90"), 90);
  assert.equal(insights.parseAnalyticsRange("5"), 30);
  assert.equal(insights.parseAnalyticsRange(undefined), 30);
});

dbTest("avatar storage replaces, reads back and deletes a photo", async () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9]);

  const first = await avatars.storeAvatar("user-avatar", jpeg, "image/jpeg");
  assert.equal(first.contentType, "image/jpeg");
  const stored = await avatars.readAvatar("user-avatar");
  assert.deepEqual([...stored.bytes], [...jpeg]);

  await avatars.storeAvatar("user-avatar", png, "image/png");
  const replaced = await avatars.readAvatar("user-avatar");
  assert.equal(replaced.contentType, "image/png");
  assert.equal(await collections.userAvatarsCollection.countDocuments({ _id: "user-avatar" }), 1);

  await assert.rejects(
    avatars.storeAvatar("user-avatar", new TextEncoder().encode("<svg/>"), "image/svg+xml"),
    /JPEG, PNG, or WebP/,
  );
  // A rejected upload leaves the previous photo untouched.
  assert.equal((await avatars.readAvatar("user-avatar")).contentType, "image/png");

  assert.equal(await avatars.deleteAvatar("user-avatar"), true);
  assert.equal(await avatars.readAvatar("user-avatar"), null);
  assert.equal(await avatars.deleteAvatar("user-avatar"), false);
});
