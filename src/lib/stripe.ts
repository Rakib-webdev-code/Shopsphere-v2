import Stripe from "stripe";

/**
 * Stripe is optional. When STRIPE_SECRET_KEY is missing the storefront keeps
 * working and checkout falls back to "pay later" orders, so a fresh clone can
 * still run without any payment account.
 */
const globalForStripe = globalThis as unknown as { stripeClient?: Stripe };

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env file.");
  }

  globalForStripe.stripeClient ??= new Stripe(secretKey);
  return globalForStripe.stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen` and copy the whsec_ value into .env.",
    );
  }

  return secret;
}

/** Public base URL used for Stripe's success and cancel redirects. */
export function resolveAppUrl(request: Request) {
  const configured = process.env.APP_URL ?? process.env.BETTER_AUTH_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}
