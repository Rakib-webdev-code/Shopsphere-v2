import { Bell, CreditCard, Package, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MarkAllReadButton } from "@/components/dashboard/dashboard-actions";
import {
  DashboardSkeleton,
  EmptyState,
  formatDateTime,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCustomerNotifications,
  type ActivityKind,
} from "@/lib/services/dashboard";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

const icons: Record<ActivityKind, typeof Bell> = {
  order_placed: Package,
  order_status: Truck,
  payment: CreditCard,
  review: Star,
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <NotificationsContent />
    </Suspense>
  );
}

async function NotificationsContent() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { items, unreadCount } = await getCustomerNotifications(user.id);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Preferences"
        title="Notifications"
        description="Order updates, payment confirmations and your reviews, newest first. This feed is built from your real order history."
        actions={<MarkAllReadButton disabled={unreadCount === 0} />}
      />

      <Panel>
        {items.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="You are all caught up"
            description="Updates about your orders and payments will appear here."
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
            {items.map((item) => {
              const Icon = icons[item.kind];
              const content = (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent-border"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      {item.unread ? (
                        <span className="rounded-full bg-accent-solid px-2 text-[10px] font-semibold uppercase leading-4 text-white">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-soft">
                      {item.detail} · {formatDateTime(item.at)}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface-subtle/40"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3.5">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
