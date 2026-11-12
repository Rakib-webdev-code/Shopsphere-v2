import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { SettingsSections } from "@/components/dashboard/settings-sections";
import { requireAdminPage } from "@/lib/auth/session";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  LOW_STOCK_THRESHOLD,
  SHIPPING_FEE_CENTS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <SettingsContent />
    </Suspense>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-foreground">{label}</span>
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          on ? "text-accent" : "text-muted-soft"
        }`}
      >
        {on ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {on ? "Configured" : "Not configured"}
      </span>
    </li>
  );
}

async function SettingsContent() {
  await connection();
  const admin = await requireAdminPage();
  // Presence checks only. Secret values are never read into the page.
  const has = (name: string) => Boolean(process.env[name]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="System"
        title="Settings"
        description="Your account settings, plus a read-only view of how this deployment is configured. Store rules live in code and environment variables."
      />
      <SettingsSections userId={admin.id} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Store rules" description="Defined in source (src/lib/constants.ts).">
          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted">Shipping fee</dt>
              <dd className="font-medium">{formatPrice(SHIPPING_FEE_CENTS)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted">Free shipping from</dt>
              <dd className="font-medium">{formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted">Low-stock threshold</dt>
              <dd className="font-medium">{LOW_STOCK_THRESHOLD} units</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Integrations" description="Whether each integration has its environment variables set.">
          <ul className="divide-y divide-border">
            <Flag on={has("STRIPE_SECRET_KEY") && has("STRIPE_WEBHOOK_SECRET")} label="Stripe payments and webhook" />
            <Flag on={has("RESEND_API_KEY") && has("EMAIL_FROM")} label="Transactional email (Resend)" />
            <Flag on={has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET")} label="Google sign-in" />
            <Flag on={has("FACEBOOK_CLIENT_ID") && has("FACEBOOK_CLIENT_SECRET")} label="Facebook sign-in" />
            <Flag on={has("GITHUB_CLIENT_ID") && has("GITHUB_CLIENT_SECRET")} label="GitHub sign-in" />
            <Flag on={has("AI_ASSISTANT_API_KEY")} label="AI shopping assistant" />
          </ul>
        </Panel>
      </div>
    </div>
  );
}
