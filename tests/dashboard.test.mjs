import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import {
  buildDayBuckets,
  buildMonthBuckets,
  buildOrderActivity,
} from "../src/lib/services/dashboard.ts";

test("buildMonthBuckets returns the last N months oldest first across a year boundary", () => {
  const buckets = buildMonthBuckets(new Date("2026-02-15T10:00:00Z"), 4);
  assert.deepEqual(
    buckets.map((bucket) => bucket.key),
    ["2025-11", "2025-12", "2026-01", "2026-02"],
  );
  assert.deepEqual(
    buckets.map((bucket) => bucket.label),
    ["Nov", "Dec", "Jan", "Feb"],
  );
  assert.ok(buckets.every((bucket) => bucket.cents === 0));
});

test("buildDayBuckets is zero filled and ends today", () => {
  const buckets = buildDayBuckets(new Date("2026-03-02T23:59:00Z"), 5);
  assert.deepEqual(
    buckets.map((bucket) => bucket.key),
    ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"],
  );
  assert.ok(buckets.every((bucket) => bucket.cents === 0 && bucket.orders === 0));
});

test("buildOrderActivity derives events only from stored facts, newest first", () => {
  const id = new ObjectId();
  const items = buildOrderActivity([
    {
      _id: id,
      orderNumber: "SS-1001",
      status: "shipped",
      createdAt: new Date("2026-01-01T10:00:00Z"),
      paidAt: new Date("2026-01-01T10:05:00Z"),
      statusHistory: [
        { status: "pending", changedAt: new Date("2026-01-01T10:00:00Z") },
        { status: "confirmed", changedAt: new Date("2026-01-01T11:00:00Z") },
        { status: "shipped", changedAt: new Date("2026-01-02T09:00:00Z") },
      ],
    },
  ]);

  assert.deepEqual(
    items.map((item) => item.kind),
    ["order_status", "order_status", "payment", "order_placed"],
  );
  assert.equal(items[0].title, "Order SS-1001 is shipped");
  assert.equal(items[0].href, `/account/orders/${id.toHexString()}`);
  // The initial "pending" history entry is the placement itself, not a change.
  assert.equal(items.filter((item) => item.kind === "order_placed").length, 1);
});

test("buildOrderActivity omits a payment event for unpaid orders", () => {
  const items = buildOrderActivity([
    {
      _id: new ObjectId(),
      orderNumber: "SS-1002",
      status: "pending",
      createdAt: new Date("2026-01-01T10:00:00Z"),
      paidAt: null,
      statusHistory: [],
    },
  ]);
  assert.deepEqual(items.map((item) => item.kind), ["order_placed"]);
});
