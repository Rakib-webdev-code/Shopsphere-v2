import { BadgeCheck, MailWarning } from "lucide-react";
import {
  ChangePasswordForm,
  ResendVerification,
} from "@/components/account-security";
import { Panel } from "@/components/dashboard/primitives";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfileForUser } from "@/lib/services/profile";

/** Appearance, email status and password panels shared by both dashboards. */
export async function SettingsSections({ userId }: { userId: string }) {
  const profile = await getProfileForUser(userId);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Panel
          title="Appearance"
          description="Choose light, dark, or follow your device. The choice is remembered in this browser."
        >
          <ThemeToggle />
        </Panel>

        <Panel title="Email">
          <p className="break-all text-sm font-medium text-foreground">
            {profile.email}
          </p>
          {profile.emailVerified ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent">
              <BadgeCheck aria-hidden="true" className="h-4 w-4" />
              Verified
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="inline-flex items-center gap-1.5 text-sm text-warning">
                <MailWarning aria-hidden="true" className="h-4 w-4" />
                Not verified yet
              </p>
              <ResendVerification email={profile.email} />
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Password"
        description="Accounts created with Google, Facebook or GitHub do not have a password here; manage those with your provider."
      >
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}
