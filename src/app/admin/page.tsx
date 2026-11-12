import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  BarChart,
  DashboardSkeleton,
  EmptyState,
  formatDateTime,
  PageIntro,
  Panel,
  PanelLink,
  StatCard,
} from "@/components/dashboard/primitives";
import { MediaThumb } from "@/components/product-media";
import { OrderStatusBadge } from "@/components/ui";
import { requireAdminPage } from "@/lib/auth/session";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getAdminStats } from "@/lib/services/admin";
import {
  getAdminActivity,
  getAdminAlerts,
  getAdminAnalytics,
} from "@/lib/services/admin-insights";

export const metadata: Metadata = { title: "Overview" };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={8} />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  await requireAdminPage();

  const [stats, analytics, alerts, activity] = await Promise.all([
    getAdminStats(),
    getAdminAnalytics(30),
    getAdminAlerts(),
    getAdminActivity(8),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Store overview"
        description="Live figures from the database. Revenue counts only orders whose payment is confirmed as paid."
        actions={
          <Link
            href="/admin/analytics"
            className="rounded-full border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-muted-strong transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Full analytics
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Paid revenue"
          value={formatPrice(stats.paidRevenueCents)}
          detail={`${stats.paidOrders} paid orders · ${formatPrice(stats.grossOrderValueCents)} gross order value`}
          icon={<Wallet />}
          href="/admin/analytics"
        />
        <StatCard
          label="Total orders"
          value={String(stats.totalOrders)}
          detail={`${stats.openOrders} open`}
          icon={<Package />}
          tone="info"
          href="/admin/orders"
        />
        <StatCard
          label="Customers"
          value={String(stats.customerCount)}
          detail="Excludes administrators"
          icon={<Users />}
          tone="shipped"
          href="/admin/customers"
        />
        <StatCard
          label="Products"
          value={String(stats.activeProducts)}
          detail={`${stats.inactiveProducts} inactive · ${stats.activeCategories} categories`}
          icon={<ShoppingBag />}
          href="/admin/products"
        />
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          detail="Need confirmation"
          icon={<Clock />}
          tone="warning"
          href="/admin/orders?status=pending"
        />
        <StatCard
          label="Completed orders"
          value={String(stats.deliveredOrders)}
          detail="Delivered"
          icon={<CheckCircle2 />}
          href="/admin/orders?status=delivered"
        />
        <StatCard
          label="Cancelled orders"
          value={String(stats.cancelledOrders)}
          icon={<Ban />}
          tone="danger"
          href="/admin/orders?status=cancelled"
        />
        <StatCard
          label="Low stock"
          value={String(alerts.lowStockCount)}
          detail={`At or below ${LOW_STOCK_THRESHOLD} units`}
          icon={<AlertTriangle />}
          tone={alerts.lowStockCount > 0 ? "warning" : "accent"}
          href="/admin/inventory"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel
          title="Paid revenue, last 30 days"
          description={`${formatPrice(analytics.paidRevenueCents)} from ${analytics.paidOrders} paid orders`}
          action={<PanelLink href="/admin/analytics">Details</PanelLink>}
        >
          <BarChart
            data={analytics.revenueByDay.map((day) => ({
              label: day.label,
              value: day.cents,
              title: `${day.label}: ${formatPrice(day.cents)}`,
            }))}
            money
            ariaLabel="Paid revenue per day for the last 30 days"
            emptyMessage="No paid orders in the last 30 days."
          />
        </Panel>

        <Panel
          title="Best-selling products"
          description="Units in non-cancelled orders, last 30 days"
        >
          {analytics.bestSellers.length === 0 ? (
            <p className="text-sm text-muted">No sales in this period yet.</p>
          ) : (
            <ol className="space-y-3">
              {analytics.bestSellers.slice(0, 5).map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-semibold text-muted-soft">
                    {index + 1}
                  </span>
                  <MediaThumb
                    src={product.image}
                    alt=""
                    variant="thumb"
                    className="h-10 w-10 shrink-0 rounded-lg"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-accent">
                    {product.units} sold
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel
          title="Recent orders"
          action={<PanelLink href="/admin/orders">View all</PanelLink>}
        >
          {stats.recentOrders.length === 0 ? (
            <EmptyState
              icon={<CreditCard />}
              title="No orders yet"
              description="Orders will appear here as customers check out."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-soft">
                  <tr>
                    <th className="pb-2 font-semibold">Order</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-foreground hover:text-accent"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="max-w-48 truncate py-3 text-muted">
                        {order.customerEmail}
                      </td>
                      <td className="py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-right font-semibold text-foreground">
                        {formatPrice(order.totalCents)}
                        {order.paymentStatus !== "paid" ? (
                          <span className="block text-[11px] font-normal text-muted-soft">
                            {order.paymentStatus}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Inventory alerts"
            action={<PanelLink href="/admin/inventory">Manage</PanelLink>}
          >
            {alerts.lowStock.length === 0 ? (
              <p className="text-sm text-muted">All active products are stocked.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.lowStock.slice(0, 5).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-foreground">{product.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.stock === 0
                          ? "bg-danger-soft text-danger"
                          : "bg-warning-soft text-warning"
                      }`}
                    >
                      {product.stock === 0 ? "Out" : `${product.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity">
            {activity.length === 0 ? (
              <p className="text-sm text-muted">No activity yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {activity.map((item) => (
                  <li key={item.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.62rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-bright ring-4 ring-background"
                    />
                    <p className="text-sm font-medium text-foreground">
                      {item.href ? (
                        <Link href={item.href} className="hover:text-accent">
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-soft">
                      {item.detail} · {formatDateTime(item.at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
