import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick something you have not used on other sites.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthShell>
  );
}
