import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderList } from "@/components/dashboard/order-list";
import {
  DashboardSkeleton,
  EmptyState,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { listOrdersForUser } from "@/lib/services/orders";
import type { OrderStatus } from "@/lib/types";
import { firstSearchParam } from "@/lib/validation";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

const ACTIVE: OrderStatus[] = ["pending", "confirmed", "processing", "shipped"];
const STATUS_FILTERS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function OrdersPage(props: PageProps<"/account/orders">) {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <OrdersContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: PageProps<"/account/orders">["searchParams"];
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!user) {
    return null;
  }

  const requested = firstSearchParam(params.status);
  const filter: "active" | "all" | OrderStatus = STATUS_FILTERS.includes(
    requested as OrderStatus,
  )
    ? (requested as OrderStatus)
    : requested === "all"
      ? "all"
      : "active";
  const orders = await listOrdersForUser(user.id);
  const visible = orders.filter((order) =>
    filter === "all"
      ? true
      : filter === "active"
        ? ACTIVE.includes(order.status)
        : order.status === filter,
  );
  const chips: { key: string; label: string; count: number }[] = [
    {
      key: "active",
      label: "In progress",
      count: orders.filter((o) => ACTIVE.includes(o.status)).length,
    },
    { key: "all", label: "All", count: orders.length },
    ...STATUS_FILTERS.map((status) => ({
      key: status,
      label: ORDER_STATUS_LABELS[status],
      count: orders.filter((o) => o.status === status).length,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Orders"
        title="My Orders"
        description="Track orders that are still on their way. Finished and cancelled orders are in Order History."
      />

      <nav aria-label="Filter orders" className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex min-w-max gap-2">
          {chips.map((chip) => {
            const active = chip.key === filter;

            return (
              <li key={chip.key}>
                <Link
                  href={
                    chip.key === "active"
                      ? "/account/orders"
                      : `/account/orders?status=${chip.key}`
                  }
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? "border-accent-border bg-accent-soft text-accent-strong"
                      : "border-border bg-surface/70 text-muted-strong hover:bg-surface-muted"
                  }`}
                >
                  {chip.label}
                  <span className="rounded-full bg-surface-subtle px-1.5 text-xs text-muted-strong">
                    {chip.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={orders.length === 0 ? "No orders yet" : "No orders in this view"}
            description={
              orders.length === 0
                ? "When you check out, your orders and status updates will appear here."
                : "Try another status filter, or open Order History for finished orders."
            }
            action={
              <Link
                href="/shop"
                className="rounded-full bg-accent-solid px-4 py-2 text-sm font-semibold text-white hover:bg-accent-solid-hover"
              >
                Browse the catalog
              </Link>
            }
          />
        ) : (
          <OrderList orders={visible} />
        )}
      </Panel>
    </div>
  );
}
