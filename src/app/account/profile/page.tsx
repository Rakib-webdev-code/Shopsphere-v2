import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  PageIntro,
} from "@/components/dashboard/primitives";
import { ProfileSections } from "@/components/dashboard/profile-sections";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Preferences"
        title="My Profile"
        description="Update your photo, name and phone number."
      />
      <Suspense fallback={<DashboardSkeleton cards={0} />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <ProfileSections userId={user.id} />;
}
