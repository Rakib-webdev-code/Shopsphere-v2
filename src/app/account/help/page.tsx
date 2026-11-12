import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/dashboard/primitives";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FEE_CENTS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Help & Support",
  robots: { index: false, follow: false },
};

const faqs: { question: string; answer: string }[] = [
  {
    question: "How do I track an order?",
    answer:
      "Open My Orders and choose an order. Its page shows the current status and a timeline of every change. Status moves from pending to confirmed, processing, shipped and delivered.",
  },
  {
    question: "When is my order marked as paid?",
    answer:
      "Card orders are marked paid only after Stripe confirms the payment. Returning from the payment page alone does not mark an order paid. Orders placed with pay-later stay unpaid until the store records payment.",
  },
  {
    question: "How much is shipping?",
    answer: `Shipping is ${formatPrice(SHIPPING_FEE_CENTS)}, and it is free when your subtotal is ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)} or more. The server calculates the final total at checkout.`,
  },
  {
    question: "Can I cancel an order?",
    answer:
      "Cancellations are handled by the store. Orders that have not shipped can be cancelled by an administrator; reserved stock is released, and a paid card order is refunded in full through Stripe.",
  },
  {
    question: "Why can I not review a product?",
    answer:
      "You can review any product from its page. Reviews are labelled “Verified purchase” when the product is in one of your delivered orders.",
  },
  {
    question: "How do I change my photo, name or password?",
    answer:
      "Use My Profile for your photo, name and phone number, and Settings for your password.",
  },
];

export default function AccountHelpPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Preferences"
        title="Help & Support"
        description="Answers to common questions about orders, payments and your account."
        actions={
          <Link href="/assistant" className={primaryButtonClass}>
            Ask the shopping assistant
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Frequently asked questions">
          <div className="divide-y divide-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="text-lg text-muted-soft transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Panel>

        <Panel title="Quick links">
          <div className="flex flex-col gap-2">
            <Link href="/account/orders" className={secondaryButtonClass}>
              My Orders
            </Link>
            <Link href="/account/addresses" className={secondaryButtonClass}>
              Saved Addresses
            </Link>
            <Link href="/account/settings" className={secondaryButtonClass}>
              Settings
            </Link>
            <Link href="/about" className={secondaryButtonClass}>
              About ShopSphere
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
