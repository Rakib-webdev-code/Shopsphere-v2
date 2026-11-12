import { History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderList } from "@/components/dashboard/order-list";
import {
  DashboardSkeleton,
  EmptyState,
  PageIntro,
  Panel,
  StatCard,
} from "@/components/dashboard/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { listOrdersForUser } from "@/lib/services/orders";
import { CheckCircle2, CreditCard, Ban } from "lucide-react";

export const metadata: Metadata = {
  title: "Order History",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={3} />}>
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const orders = await listOrdersForUser(user.id);
  const finished = orders.filter(
    (order) => order.status === "delivered" || order.status === "cancelled",
  );
  const delivered = finished.filter((order) => order.status === "delivered");
  const cancelled = finished.length - delivered.length;
  const paidSpend = orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Orders"
        title="Order History"
        description="Delivered and cancelled orders. Open an order to see its items, address and status timeline."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Delivered"
          value={String(delivered.length)}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Cancelled"
          value={String(cancelled)}
          icon={<Ban />}
          tone="danger"
        />
        <StatCard
          label="Total paid"
          value={formatPrice(paidSpend)}
          detail="Across all paid orders"
          icon={<CreditCard />}
          tone="info"
        />
      </div>

      <Panel>
        {finished.length === 0 ? (
          <EmptyState
            icon={<History />}
            title="No finished orders yet"
            description="Once an order is delivered or cancelled it moves here."
            action={
              <Link
                href="/account/orders"
                className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-muted-strong hover:bg-surface-muted"
              >
                View current orders
              </Link>
            }
          />
        ) : (
          <OrderList orders={finished} />
        )}
      </Panel>
    </div>
  );
}
