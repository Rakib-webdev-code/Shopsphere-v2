import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { customerNavGroups } from "@/components/dashboard/dashboard-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { countUnreadCustomerNotifications } from "@/lib/services/dashboard";

export const metadata: Metadata = {
  title: {
    default: "Your account",
    template: "%s · ShopSphere",
  },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AccountGate>{children}</AccountGate>
    </Suspense>
  );
}

async function AccountGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=%2Faccount");
  }

  const unread = await countUnreadCustomerNotifications(user.id);

  return (
    <DashboardShell
      variant="customer"
      groups={customerNavGroups}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
      notificationCount={unread}
      notificationsHref="/account/notifications"
      profileHref="/account/profile"
      settingsHref="/account/settings"
      search={{
        action: "/shop",
        name: "q",
        placeholder: "Search products",
        label: "Search products",
      }}
    >
      {children}
    </DashboardShell>
  );
}

function ShellFallback() {
  return (
    <div className="dash-backdrop min-h-screen" aria-hidden="true">
      <div className="h-16 animate-pulse bg-surface-subtle/60 lg:ml-[17.5rem]" />
      <div className="p-6 lg:ml-[17.5rem]">
        <div className="h-72 animate-pulse rounded-2xl bg-surface-subtle" />
      </div>
    </div>
  );
}
