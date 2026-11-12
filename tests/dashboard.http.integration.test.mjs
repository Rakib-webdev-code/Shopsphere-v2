import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import test, { after, before } from "node:test";
import { ObjectId } from "mongodb";
import {
  assertIsolatedDatabase,
  configureTestDatabase,
  dropTestDatabase,
} from "./support/test-db.mjs";

const enabled =
  (process.env.SHOPSPHERE_HTTP_TESTS === "1" ||
    process.env.npm_lifecycle_event === "test:http") &&
  existsSync(path.join(process.cwd(), ".next", "BUILD_ID")) &&
  Boolean(process.env.MONGODB_URI);
const httpTest = enabled ? test : test.skip;
const testDbName = enabled ? configureTestDatabase({ transactions: "auto" }) : null;

let db;
let mongoClient;
let collections;
let server;
let baseUrl;
let serverOutput = "";
let admin;
let alice;
let bob;

// A real 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function freePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : null;
      probe.close(() => (port ? resolve(port) : reject(new Error("no port"))));
    });
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited early.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/sign-in`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return;
    } catch {
      // still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js did not start in time.\n${serverOutput}`);
}

async function signUp(label) {
  const email = `${label}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}@example.test`;
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({
      name: `Test ${label}`,
      email,
      password: "Test-password-123!",
    }),
  });
  const body = await response.text();
  assert.equal(response.status, 200, body);
  const cookies = response.headers.getSetCookie();
  const doc = await collections.usersCollection.findOne({ email });
  assert.ok(doc);
  return {
    email,
    id: doc._id.toHexString(),
    cookie: cookies.map((value) => value.split(";")[0]).join("; "),
  };
}

function get(pathname, cookie) {
  return fetch(`${baseUrl}${pathname}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
}

function upload(bytes, type, cookie, name = "avatar.png") {
  const form = new FormData();
  form.append("file", new File([bytes], name, { type }));
  return fetch(`${baseUrl}/api/profile/avatar`, {
    method: "POST",
    headers: { cookie, origin: baseUrl },
    body: form,
  });
}

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

function orderDoc(userId, number, status, paymentStatus, items, at) {
  const total = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return {
    _id: new ObjectId(),
    orderNumber: number,
    userId,
    customerEmail: "buyer@example.test",
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
  };
}

if (enabled) {
  const mongodb = await import("../src/lib/mongodb.ts");
  db = mongodb.db;
  mongoClient = mongodb.mongoClient;
  assertIsolatedDatabase(db.databaseName);
  collections = await import("../src/lib/db/collections.ts");

  before(async () => {
    await collections.ensureCatalogIndexes();
    const port = await freePort();
    baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(
      process.execPath,
      [
        path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
        "start",
        "-H",
        "127.0.0.1",
        "-p",
        String(port),
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_DB: testDbName,
          MONGODB_TRANSACTIONS: "auto",
          BETTER_AUTH_URL: baseUrl,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (c) => (serverOutput += c.toString()));
    server.stderr.on("data", (c) => (serverOutput += c.toString()));
    await waitForServer();

    admin = await signUp("admin");
    alice = await signUp("alice");
    bob = await signUp("bob");
    await collections.usersCollection.updateOne(
      { _id: new ObjectId(admin.id) },
      { $set: { role: "admin" } },
    );

    const p1 = new ObjectId();
    const p2 = new ObjectId();
    const now = Date.now();
    const day = 86_400_000;
    await collections.ordersCollection.insertMany([
      orderDoc(alice.id, "AL-1", "delivered", "paid", [line(p1, "Alpha", 2, 1500)], new Date(now - 5 * day)),
      orderDoc(alice.id, "AL-2", "pending", "unpaid", [line(p2, "Beta", 4, 7777)], new Date(now - 1 * day)),
      orderDoc(alice.id, "AL-3", "cancelled", "refunded", [line(p1, "Alpha", 9, 1500)], new Date(now - 9 * day)),
      orderDoc(bob.id, "BO-1", "delivered", "paid", [line(p1, "Alpha", 1, 98765)], new Date(now - 2 * day)),
    ]);
  });

  after(async () => {
    if (server && server.exitCode === null) {
      server.kill();
      await Promise.race([
        once(server, "exit"),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    }
    await dropTestDatabase(db, testDbName);
    await mongoClient.close();
  });
}

const CUSTOMER_ROUTES = [
  "/account",
  "/account/orders",
  "/account/history",
  "/account/wishlist",
  "/account/cart",
  "/account/addresses",
  "/account/reviews",
  "/account/notifications",
  "/account/profile",
  "/account/settings",
  "/account/help",
];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/analytics",
  "/admin/products",
  "/admin/categories",
  "/admin/orders",
  "/admin/customers",
  "/admin/inventory",
  "/admin/coupons",
  "/admin/reviews",
  "/admin/promotions",
  "/admin/notifications",
  "/admin/profile",
  "/admin/settings",
  "/admin/help",
];

// Dashboard pages stream (Cache Components / partial prerendering) and the
// auth gate runs inside Suspense, so the HTTP status is already 200 when
// `redirect()` / `notFound()` fire. What matters, and what these tests check,
// is that no protected content is rendered and the framework emits the
// redirect / not-found signal.
httpTest("unauthenticated visitors get a sign-in redirect and no dashboard content", async () => {
  for (const route of [...CUSTOMER_ROUTES, ...ADMIN_ROUTES]) {
    const response = await get(route);
    const html = await response.text();
    assert.match(html, /NEXT_REDIRECT;replace;\/sign-in/, `${route} should redirect to sign-in`);
    assert.doesNotMatch(html, /dashboard-sidebar/, `${route} must not render the shell`);
  }
});

httpTest("customers can open every customer dashboard route", async () => {
  for (const route of CUSTOMER_ROUTES) {
    const response = await get(route, alice.cookie);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /Shopping Cart/, `${route} should render the sidebar`);
    assert.match(html, /Logout/, `${route} should render the logout action`);
  }
});

httpTest("customers get a not-found response and no admin content on admin routes", async () => {
  for (const route of ADMIN_ROUTES) {
    const response = await get(route, alice.cookie);
    const html = await response.text();
    assert.match(html, /NEXT_HTTP_ERROR_FALLBACK;404/, `${route} should be not-found for customers`);
    assert.doesNotMatch(
      html,
      /dashboard-sidebar|Store overview|Paid revenue|Inventory alerts/,
      `${route} must not leak admin content`,
    );
  }
});

httpTest("admins can open every admin dashboard route", async () => {
  for (const route of ADMIN_ROUTES) {
    const response = await get(route, admin.cookie);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /Inventory &amp; Stock/, `${route} should render the admin sidebar`);
  }
});

httpTest("customer overview shows only the signed-in customer's real paid totals", async () => {
  const html = await (await get("/account", alice.cookie)).text();
  // Alice paid 2 x $15.00 = $30.00. Her unpaid $310.00 order must not be counted.
  assert.match(html, /\$30\.00/);
  assert.doesNotMatch(html, /\$310\.08/);
  // Bob's $987.65 paid order must never appear for Alice.
  assert.doesNotMatch(html, /987\.65/);

  const bobHtml = await (await get("/account", bob.cookie)).text();
  assert.match(bobHtml, /\$987\.65/);
  assert.doesNotMatch(bobHtml, /\$30\.00/);
});

httpTest("admin overview counts paid revenue only and excludes admins from customers", async () => {
  const html = await (await get("/admin", admin.cookie)).text();
  // Paid: $30.00 + $987.65 = $1,017.65. The $310.88 unpaid order is excluded.
  assert.match(html, /\$1,017\.65/);
  const gross = /\$1,328\.\d\d/;
  assert.match(html, gross, "gross order value is shown separately");
});

httpTest("avatar upload, read, ownership and removal", async () => {
  const anonymous = await upload(PNG, "image/png", "");
  assert.equal(anonymous.status, 401);

  const ok = await upload(PNG, "image/png", alice.cookie);
  assert.equal(ok.status, 200, await ok.clone().text());
  const body = await ok.json();
  assert.match(body.profile.image, new RegExp(`^/api/profile/avatar/${alice.id}\\?v=\\d+$`));

  const own = await get(body.profile.image, alice.cookie);
  assert.equal(own.status, 200);
  assert.equal(own.headers.get("content-type"), "image/png");
  assert.equal(own.headers.get("x-content-type-options"), "nosniff");
  assert.match(own.headers.get("cache-control") ?? "", /private/);
  assert.deepEqual(Buffer.from(await own.arrayBuffer()), PNG);

  assert.equal((await get(body.profile.image)).status, 401);
  assert.equal((await get(body.profile.image, bob.cookie)).status, 404);
  assert.equal((await get(body.profile.image, admin.cookie)).status, 200);

  // The profile form must not erase the photo.
  const patch = await fetch(`${baseUrl}/api/profile`, {
    method: "PATCH",
    headers: { cookie: alice.cookie, origin: baseUrl, "content-type": "application/json" },
    body: JSON.stringify({ name: "Alice Updated", phone: null }),
  });
  assert.equal(patch.status, 200);
  assert.equal((await patch.json()).profile.image, body.profile.image);

  const removed = await fetch(`${baseUrl}/api/profile/avatar`, {
    method: "DELETE",
    headers: { cookie: alice.cookie, origin: baseUrl },
  });
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).profile.image, null);
  assert.equal((await get(body.profile.image, alice.cookie)).status, 404);
});

httpTest("avatar upload rejects SVG, spoofed types and oversized files", async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const asSvg = await upload(svg, "image/svg+xml", bob.cookie, "a.svg");
  assert.equal(asSvg.status, 400);

  const spoofed = await upload(svg, "image/png", bob.cookie, "a.png");
  assert.equal(spoofed.status, 400);

  const mismatch = await upload(PNG, "image/jpeg", bob.cookie, "a.jpg");
  assert.equal(mismatch.status, 400);

  const big = Buffer.alloc(3 * 1024 * 1024);
  PNG.copy(big);
  const oversized = await upload(big, "image/png", bob.cookie);
  assert.equal(oversized.status, 413);

  const profile = await collections.usersCollection.findOne({ _id: new ObjectId(bob.id) });
  assert.ok(!profile.image, "a rejected upload must not change the user's image");
});

httpTest("notifications can be marked as read", async () => {
  const before = await collections.usersCollection.findOne({ _id: new ObjectId(alice.id) });
  assert.ok(!before.notificationsSeenAt);
  assert.equal((await fetch(`${baseUrl}/api/notifications/seen`, { method: "POST" })).status, 401);
  const response = await fetch(`${baseUrl}/api/notifications/seen`, {
    method: "POST",
    headers: { cookie: alice.cookie, origin: baseUrl },
  });
  assert.equal(response.status, 200);
  const after = await collections.usersCollection.findOne({ _id: new ObjectId(alice.id) });
  assert.ok(after.notificationsSeenAt instanceof Date);
});
