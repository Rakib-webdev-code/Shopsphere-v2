import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/primitives";
import { requireAdminPage } from "@/lib/auth/session";
import { PageIntro, Panel } from "@/components/dashboard/primitives";
import { secondaryButtonClass } from "@/components/ui";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export const metadata: Metadata = { title: "Help & Support" };

const guides: { title: string; body: string }[] = [
  {
    title: "Order lifecycle",
    body: "Orders move pending → confirmed → processing → shipped → delivered. Only valid next steps are offered on an order page. Cancelling releases reserved stock, and a paid card order is refunded in full through Stripe.",
  },
  {
    title: "What counts as revenue",
    body: "Paid revenue includes only orders with payment status paid, which is set by the signed Stripe webhook. Unpaid, failed and refunded orders are never counted.",
  },
  {
    title: "Inventory",
    body: `Stock is reserved atomically when an order is placed and restored if the order is cancelled. Products at or below ${LOW_STOCK_THRESHOLD} units appear as low stock. Manual stock changes require a reason and are recorded in the adjustment log.`,
  },
  {
    title: "Reconciliation",
    body: "If stock or a coupon cannot be restored automatically (for example the product was deleted), the order is flagged here and on its order page. Repair the missing data and retry recovery, or force-release it, which records who resolved the order. Check stock manually afterwards.",
  },
  {
    title: "Coupons and promotions",
    body: "Discount codes are managed under Coupons. A product shows as promoted when its compare-at price is higher than its price; see Promotions for the list.",
  },
];

export default function AdminHelpPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <HelpContent />
    </Suspense>
  );
}

// Gated and dynamic so the guide is never part of a prerendered shell that a
// non-admin could receive.
async function HelpContent() {
  await connection();
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="System"
        title="Help & Support"
        description="A short operating guide for store administrators."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Admin guide">
          <div className="divide-y divide-border">
            {guides.map((guide) => (
              <details key={guide.title} className="group py-3" open={guide === guides[0]}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                  {guide.title}
                  <span aria-hidden="true" className="text-lg text-muted-soft transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted">{guide.body}</p>
              </details>
            ))}
          </div>
        </Panel>
        <Panel title="Shortcuts">
          <div className="flex flex-col gap-2">
            <Link href="/admin/orders" className={secondaryButtonClass}>Orders</Link>
            <Link href="/admin/inventory" className={secondaryButtonClass}>Inventory & Stock</Link>
            <Link href="/admin/analytics" className={secondaryButtonClass}>Analytics & Reports</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
