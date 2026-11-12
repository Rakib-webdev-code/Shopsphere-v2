import { AlertTriangle, Clock, ShieldAlert, Star, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import {
  DashboardSkeleton,
  formatDateTime,
  PageIntro,
  Panel,
  PanelLink,
} from "@/components/dashboard/primitives";
import { requireAdminPage } from "@/lib/auth/session";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getAdminAlerts } from "@/lib/services/admin-insights";

export const metadata: Metadata = { title: "Notifications" };

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <NotificationsContent />
    </Suspense>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-3 text-sm">
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent [&>svg]:h-4 [&>svg]:w-4"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

async function NotificationsContent() {
  await connection();
  await requireAdminPage();

  const alerts = await getAdminAlerts();
  const nothing =
    alerts.pendingOrderCount === 0 &&
    alerts.reconciliation.length === 0 &&
    alerts.lowStockCount === 0;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Store"
        title="Notifications"
        description="Live alerts computed from current data. They clear on their own once the underlying issue is resolved."
      />

      {nothing ? (
        <Panel>
          <p className="text-sm text-muted">
            Nothing needs attention right now: no pending orders, no orders
            awaiting reconciliation, and no low-stock products.
          </p>
        </Panel>
      ) : null}

      {alerts.reconciliation.length > 0 ? (
        <Panel
          title="Orders needing reconciliation"
          description="Stock or a coupon could not be restored automatically. Open each order to resolve it."
        >
          <ul className="divide-y divide-border">
            {alerts.reconciliation.map((order) => (
              <Row key={order.id} icon={<ShieldAlert />}>
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-danger hover:underline">
                  {order.orderNumber}
                </Link>
                {order.error ? (
                  <span className="block truncate text-xs text-muted-soft">{order.error}</span>
                ) : null}
              </Row>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel
        title={`Pending orders (${alerts.pendingOrderCount})`}
        action={<PanelLink href="/admin/orders?status=pending">Open</PanelLink>}
      >
        {alerts.pendingOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders are waiting for confirmation.</p>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.pendingOrders.map((order) => (
              <Row key={order.id} icon={<Clock />}>
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-foreground hover:text-accent">
                  {order.orderNumber}
                </Link>
                <span className="block text-xs text-muted-soft">{formatDateTime(order.at)}</span>
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={`Low stock (${alerts.lowStockCount})`}
        description={`Active products at or below ${LOW_STOCK_THRESHOLD} units`}
        action={<PanelLink href="/admin/inventory">Inventory</PanelLink>}
      >
        {alerts.lowStock.length === 0 ? (
          <p className="text-sm text-muted">All active products are stocked.</p>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.lowStock.map((product) => (
              <Row key={product.id} icon={<AlertTriangle />}>
                <span className="font-medium text-foreground">{product.name}</span>
                <span className="ml-2 text-xs text-muted-soft">
                  {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                </span>
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="New reviews, last 7 days" action={<PanelLink href="/admin/reviews">Open</PanelLink>}>
          {alerts.recentReviews.length === 0 ? (
            <p className="text-sm text-muted">No new reviews this week.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.recentReviews.map((review) => (
                <Row key={review.id} icon={<Star />}>
                  <span className="text-foreground">
                    {review.author} left {review.rating} {review.rating === 1 ? "star" : "stars"}
                  </span>
                  <span className="block text-xs text-muted-soft">{formatDateTime(review.at)}</span>
                </Row>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="New customers, last 7 days" action={<PanelLink href="/admin/customers">Open</PanelLink>}>
          <p className="flex items-center gap-3 text-sm text-foreground">
            <UserPlus aria-hidden="true" className="h-5 w-5 text-accent" />
            <span className="text-2xl font-bold">{alerts.newCustomers7d}</span>
            <span className="text-muted">new accounts</span>
          </p>
        </Panel>
      </div>
    </div>
  );
}
