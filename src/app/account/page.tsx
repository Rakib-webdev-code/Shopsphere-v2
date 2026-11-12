import {
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Loader,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  BarChart,
  DashboardSkeleton,
  DonutChart,
  EmptyState,
  formatDate,
  formatDateTime,
  PageIntro,
  Panel,
  PanelLink,
  STATUS_COLORS,
  StatCard,
} from "@/components/dashboard/primitives";
import { MediaThumb } from "@/components/product-media";
import { OrderStatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { getCustomerDashboard } from "@/lib/services/dashboard";
import { getWishlistForUser } from "@/lib/services/wishlist";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={8} />}>
      <AccountOverview />
    </Suspense>
  );
}

async function AccountOverview() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [data, wishlist] = await Promise.all([
    getCustomerDashboard(user.id),
    getWishlistForUser(user.id),
  ]);
  const { totals } = data;
  const inProgress = totals.byStatus.confirmed + totals.byStatus.processing;
  const firstName = user.name.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Everything below is calculated from your own orders, wishlist and reviews."
        actions={
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-accent-solid px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            Continue shopping
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Products purchased"
          value={String(totals.itemsPurchased)}
          detail="Units across non-cancelled orders"
          icon={<PackageCheck />}
          href="/account/history"
        />
        <StatCard
          label="Total orders"
          value={String(totals.totalOrders)}
          detail={`${totals.paidOrders} paid`}
          icon={<Package />}
          tone="info"
          href="/account/orders"
        />
        <StatCard
          label="Total spent"
          value={formatPrice(totals.paidSpendCents)}
          detail="Paid orders only"
          icon={<CreditCard />}
          tone="accent"
        />
        <StatCard
          label="Wishlist"
          value={String(wishlist.products.length)}
          detail="Saved products"
          icon={<Heart />}
          tone="danger"
          href="/account/wishlist"
        />
        <StatCard
          label="Pending"
          value={String(totals.byStatus.pending)}
          detail="Awaiting confirmation"
          icon={<Clock />}
          tone="warning"
          href="/account/orders?status=pending"
        />
        <StatCard
          label="Processing"
          value={String(inProgress)}
          detail={`${totals.byStatus.confirmed} confirmed, ${totals.byStatus.processing} in processing`}
          icon={<Loader />}
          tone="info"
          href="/account/orders?status=processing"
        />
        <StatCard
          label="Shipped"
          value={String(totals.byStatus.shipped)}
          detail="On the way"
          icon={<Truck />}
          tone="shipped"
          href="/account/orders?status=shipped"
        />
        <StatCard
          label="Delivered"
          value={String(totals.byStatus.delivered)}
          detail={`${totals.byStatus.cancelled} cancelled`}
          icon={<CheckCircle2 />}
          href="/account/history"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Spending, last 6 months"
          description="Counts only orders whose payment was confirmed."
        >
          <BarChart
            data={data.spendByMonth.map((month) => ({
              label: month.label,
              value: month.cents,
              title: `${month.label}: ${formatPrice(month.cents)}`,
            }))}
            money
            ariaLabel="Paid spending per month for the last six months"
            emptyMessage="No paid orders in the last six months yet."
          />
        </Panel>

        <Panel title="Orders by status">
          <DonutChart
            centerLabel="orders"
            emptyMessage="Place an order to see your status breakdown."
            segments={(
              [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ] as const
            ).map((status) => ({
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: totals.byStatus[status],
              color: STATUS_COLORS[status],
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Recent orders"
          action={<PanelLink href="/account/orders">View all</PanelLink>}
        >
          {data.recentOrders.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title="No orders yet"
              description="When you place an order, its status and totals will appear here."
              action={
                <Link
                  href="/shop"
                  className="rounded-full bg-accent-solid px-4 py-2 text-sm font-semibold text-white hover:bg-accent-solid-hover"
                >
                  Start shopping
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:text-accent"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-soft">
                        {formatDate(order.createdAt)} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(order.totalCents)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Wishlist summary"
          action={<PanelLink href="/account/wishlist">Open</PanelLink>}
        >
          {wishlist.products.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Nothing saved yet. Use “Save to wishlist” on any product to keep it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {wishlist.products.slice(0, 4).map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-subtle/60"
                  >
                    <MediaThumb
                      src={product.images[0] ?? null}
                      variant="thumb"
                      alt=""
                      icon={product.category?.icon ?? "headphones"}
                      className="h-12 w-12 shrink-0 rounded-lg"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-soft">
                        {formatPrice(product.priceInCents)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {wishlist.products.length > 4 ? (
                <li className="px-1.5 text-xs text-muted-soft">
                  +{wishlist.products.length - 4} more saved
                </li>
              ) : null}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recently purchased products">
          {data.recentProducts.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Products from your orders will show up here.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.recentProducts.map((product) => (
                <li key={product.productId}>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-2.5 transition-colors hover:border-accent-border hover:bg-accent-soft/50"
                  >
                    <MediaThumb
                      src={product.image}
                      variant="thumb"
                      alt=""
                      icon="headphones"
                      className="h-12 w-12 shrink-0 rounded-lg"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-soft">
                        {formatDate(product.orderedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          action={<PanelLink href="/account/notifications">See all</PanelLink>}
        >
          {data.activity.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Order updates, payments and reviews will appear here.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {data.activity.map((item) => (
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
                  <p className="text-xs text-muted-soft">
                    {formatDateTime(item.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
