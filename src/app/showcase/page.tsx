import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "How ShopSphere is built",
  description:
    "A tour of the features, security decisions and tech stack behind the ShopSphere full-stack storefront.",
};

const featureGroups = [
  {
    title: "Storefront",
    items: [
      "Search, category and price filters, sorting and pagination",
      "Product pages with gallery, live stock state, related products and reviews",
      "Light and dark themes with no flash on load",
      "Shopping assistant that answers from the live catalog only",
    ],
  },
  {
    title: "Accounts",
    items: [
      "Email and password plus Google and Facebook sign-in",
      "Email verification and password reset links",
      "Saved addresses, profile, wishlist and a cart that follows the account",
      "Verified-purchase reviews with real rating aggregation",
    ],
  },
  {
    title: "Checkout and payments",
    items: [
      "Prices, stock, coupons and shipping recalculated on the server",
      "Stripe Checkout for cards, confirmed by a signed webhook",
      "Pay-later orders that can be paid from the order page",
      "Automatic full refund when an admin cancels a paid order",
    ],
  },
  {
    title: "Admin panel",
    items: [
      "Dashboard with paid revenue, orders, customers and low stock",
      "Products, categories, coupons and inventory with an audit trail",
      "Order status changes limited to allowed transitions",
      "Recovery tools for orders whose stock release needs attention",
    ],
  },
] as const;

const decisions = [
  {
    title: "The server decides every price",
    body: "The browser only says which items and which coupon. Totals are calculated and stored on the server, and Stripe is charged from those stored amounts, so a tampered request cannot change what a customer pays.",
  },
  {
    title: "Stock cannot be oversold",
    body: "Stock is reserved with conditional database updates. Two people buying the last item at the same moment cannot both succeed, and a crash mid-checkout is repaired by a recovery job instead of leaving items stuck.",
  },
  {
    title: "A payment is only real once Stripe says so",
    body: "Returning from the payment page proves nothing. An order becomes paid only when a webhook arrives with a valid Stripe signature, and repeated deliveries of the same event change nothing.",
  },
  {
    title: "Roles are checked where the data is",
    body: "Admin pages and admin API routes read the user's role from the database on every request instead of trusting a cookie, and customers can only read their own orders.",
  },
  {
    title: "Motion answers the visitor",
    body: "Framer Motion is used for the opening price tags, card lift, add-to-cart feedback and the payment check mark. Everything respects the device's reduce-motion setting.",
  },
] as const;

const checkoutSteps = [
  "The cart is checked against live prices and stock.",
  "The order is created and the stock is reserved in one guarded step.",
  "Stripe Checkout opens for card payment, or the order waits as pay later.",
  "A signed webhook marks the order paid.",
  "An admin moves it through processing, shipped and delivered.",
] as const;

const stack = [
  "Next.js 16 App Router",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "Framer Motion",
  "MongoDB",
  "Better Auth",
  "Stripe",
] as const;

export default function ShowcasePage() {
  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
            How ShopSphere is built
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            ShopSphere is a complete online store, from sign-up to card payment
            to the admin who ships the order. This page is the short tour for
            anyone who wants to know what is inside and why it was built this
            way.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-accent-solid px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Try the store
              <ArrowRightIcon />
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center rounded-full border border-border-strong bg-surface px-6 py-3 text-sm font-semibold text-muted-strong transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Ask the assistant
            </Link>
          </div>
        </div>

        <section aria-labelledby="features-heading" className="mt-16">
          <h2 id="features-heading" className="text-2xl font-bold text-foreground">
            What it can do
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {featureGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm leading-6 text-muted">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-bright"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="decisions-heading"
          className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]"
        >
          <div>
            <h2
              id="decisions-heading"
              className="text-2xl font-bold text-foreground"
            >
              Decisions that matter in a real shop
            </h2>
            <p className="mt-3 max-w-md text-base leading-7 text-muted">
              Anyone can build a product grid. These are the parts that decide
              whether a store can be trusted with money.
            </p>
          </div>
          <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {decisions.map((decision) => (
              <div key={decision.title} className="p-6">
                <dt className="text-base font-semibold text-foreground">
                  {decision.title}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  {decision.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="flow-heading"
          className="mt-16 rounded-3xl bg-accent-soft p-6 ring-1 ring-accent-border sm:p-10"
        >
          <h2 id="flow-heading" className="text-2xl font-bold text-foreground">
            What happens when someone buys
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-5">
            {checkoutSteps.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted-strong ring-1 ring-border"
              >
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-solid text-xs font-bold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="stack-heading" className="mt-16">
          <h2 id="stack-heading" className="text-2xl font-bold text-foreground">
            Built with
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-muted-strong"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </StorefrontShell>
  );
}
