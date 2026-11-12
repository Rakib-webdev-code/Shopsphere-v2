import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  PageIntro,
} from "@/components/dashboard/primitives";
import { ProfileSections } from "@/components/dashboard/profile-sections";
import { requireAdminPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin Profile" };

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  await connection();
  const admin = await requireAdminPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="System"
        title="Admin Profile"
        description="Update your photo, name and phone number."
      />
      <ProfileSections userId={admin.id} />
    </div>
  );
}
