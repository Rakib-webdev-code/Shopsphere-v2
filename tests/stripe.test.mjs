import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

const { isStripeConfigured, resolveAppUrl, getStripe } = await import(
  "@/lib/stripe"
);

test("card payments are off until STRIPE_SECRET_KEY is set", () => {
  const original = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal(isStripeConfigured(), false);
  assert.throws(() => getStripe(), /STRIPE_SECRET_KEY/);
  process.env.STRIPE_SECRET_KEY = "sk_test_unit";
  assert.equal(isStripeConfigured(), true);

  if (original === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = original;
  }
});

test("redirect URL prefers APP_URL, then BETTER_AUTH_URL, then the request origin", () => {
  const originalApp = process.env.APP_URL;
  const originalAuth = process.env.BETTER_AUTH_URL;
  const request = new Request("http://example.test:4000/api/orders/1/pay");

  delete process.env.APP_URL;
  delete process.env.BETTER_AUTH_URL;
  assert.equal(resolveAppUrl(request), "http://example.test:4000");

  process.env.BETTER_AUTH_URL = "https://shop.example.com/";
  assert.equal(resolveAppUrl(request), "https://shop.example.com");

  process.env.APP_URL = "https://app.example.com";
  assert.equal(resolveAppUrl(request), "https://app.example.com");

  if (originalApp === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalApp;
  if (originalAuth === undefined) delete process.env.BETTER_AUTH_URL;
  else process.env.BETTER_AUTH_URL = originalAuth;
});

test("webhook signatures: valid is accepted, tampered or wrong secret is rejected", () => {
  const stripe = new Stripe("sk_test_unit");
  const secret = "whsec_unit_test_secret";
  const payload = JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_1", payment_status: "paid" } },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

  const event = stripe.webhooks.constructEvent(payload, header, secret);
  assert.equal(event.type, "checkout.session.completed");

  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload, header, "whsec_other"),
  );
});
