import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { adminNavGroups } from "@/components/dashboard/dashboard-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { countAdminAttention } from "@/lib/services/admin-insights";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · ShopSphere Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=%2Fadmin");
  }

  // The role is re-read from MongoDB by getCurrentUser, never from a cookie.
  if (user.role !== "admin") {
    notFound();
  }

  const attention = await countAdminAttention();

  return (
    <DashboardShell
      variant="admin"
      groups={adminNavGroups}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
      notificationCount={attention}
      notificationsHref="/admin/notifications"
      profileHref="/admin/profile"
      settingsHref="/admin/settings"
      search={{
        action: "/admin/orders",
        name: "q",
        placeholder: "Search orders",
        label: "Search orders by number or email",
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
