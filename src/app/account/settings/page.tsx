import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  PageIntro,
} from "@/components/dashboard/primitives";
import { SettingsSections } from "@/components/dashboard/settings-sections";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Preferences"
        title="Settings"
        description="Appearance, email status and password."
      />
      <Suspense fallback={<DashboardSkeleton cards={0} />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <SettingsSections userId={user.id} />;
}
