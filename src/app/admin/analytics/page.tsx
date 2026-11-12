import { CreditCard, Receipt, ShoppingBag, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  BarChart,
  DashboardSkeleton,
  DonutChart,
  PageIntro,
  Panel,
  STATUS_COLORS,
  StatCard,
} from "@/components/dashboard/primitives";
import { MediaThumb } from "@/components/product-media";
import { requireAdminPage } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import {
  ANALYTICS_RANGES,
  getAdminAnalytics,
  parseAnalyticsRange,
} from "@/lib/services/admin-insights";
import { firstSearchParam } from "@/lib/validation";

export const metadata: Metadata = { title: "Analytics & Reports" };

export default function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  return (
    <Suspense fallback={<DashboardSkeleton cards={4} />}>
      <AnalyticsContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/analytics">["searchParams"];
}) {
  await connection();
  await requireAdminPage();

  const params = await searchParams;
  const days = parseAnalyticsRange(firstSearchParam(params.range));
  const data = await getAdminAnalytics(days);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Analytics & Reports"
        description="Paid revenue is counted only for orders whose payment is confirmed. Order counts include every order placed in the period."
        actions={
          <nav aria-label="Date range" className="flex gap-2">
            {ANALYTICS_RANGES.map((range) => (
              <Link
                key={range}
                href={`/admin/analytics?range=${range}`}
                aria-current={range === days ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  range === days
                    ? "border-accent-border bg-accent-soft text-accent-strong"
                    : "border-border bg-surface/70 text-muted-strong hover:bg-surface-muted"
                }`}
              >
                {range} days
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Paid revenue"
          value={formatPrice(data.paidRevenueCents)}
          detail={`${data.paidOrders} paid orders`}
          icon={<CreditCard />}
        />
        <StatCard
          label="Average paid order"
          value={formatPrice(data.averagePaidOrderCents)}
          icon={<Receipt />}
          tone="info"
        />
        <StatCard
          label="Orders placed"
          value={String(data.ordersInRange)}
          icon={<ShoppingBag />}
          tone="shipped"
        />
        <StatCard
          label="New customers"
          value={String(data.newCustomers)}
          icon={<UserPlus />}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Paid revenue per day (${days} days)`}>
          <BarChart
            data={data.revenueByDay.map((day) => ({
              label: day.label,
              value: day.cents,
              title: `${day.label}: ${formatPrice(day.cents)}`,
            }))}
            money
            ariaLabel={`Paid revenue per day for the last ${days} days`}
            emptyMessage="No paid orders in this period."
          />
        </Panel>
        <Panel title={`Orders placed per day (${days} days)`}>
          <BarChart
            data={data.revenueByDay.map((day) => ({
              label: day.label,
              value: day.orders,
              title: `${day.label}: ${day.orders} orders`,
            }))}
            ariaLabel={`Orders placed per day for the last ${days} days`}
            emptyMessage="No orders in this period."
          />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Orders by status" description="Orders placed in this period">
          <DonutChart
            centerLabel="orders"
            emptyMessage="No orders in this period."
            segments={data.statusBreakdown.map((entry) => ({
              label: entry.label,
              value: entry.count,
              color: STATUS_COLORS[entry.status],
            }))}
          />
        </Panel>
        <Panel title="Payments" description="Orders placed in this period">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-soft">Card</dt>
              <dd className="text-xl font-bold text-foreground">{data.paymentMix.card}</dd>
            </div>
            <div>
              <dt className="text-muted-soft">Pay later</dt>
              <dd className="text-xl font-bold text-foreground">{data.paymentMix.payLater}</dd>
            </div>
            <div>
              <dt className="text-muted-soft">Paid</dt>
              <dd className="text-xl font-bold text-accent">{data.paymentMix.paid}</dd>
            </div>
            <div>
              <dt className="text-muted-soft">Not paid</dt>
              <dd className="text-xl font-bold text-foreground">{data.paymentMix.unpaid}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel
        title="Best-selling products"
        description="Units in non-cancelled orders placed in this period. “Order value” is not revenue, because some of these orders may be unpaid."
      >
        {data.bestSellers.length === 0 ? (
          <p className="text-sm text-muted">No sales in this period yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-soft">
                <tr>
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Units</th>
                  <th className="pb-2 text-right font-semibold">Order value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.bestSellers.map((product) => (
                  <tr key={product.productId}>
                    <td className="py-3">
                      <span className="flex items-center gap-3">
                        <MediaThumb
                          src={product.image}
                          alt=""
                          variant="thumb"
                          className="h-10 w-10 shrink-0 rounded-lg"
                        />
                        <span className="font-medium text-foreground">{product.name}</span>
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">{product.units}</td>
                    <td className="py-3 text-right text-muted">
                      {formatPrice(product.orderValueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
