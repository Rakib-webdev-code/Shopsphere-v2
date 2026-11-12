import { AvatarUploader } from "@/components/avatar-uploader";
import { Panel } from "@/components/dashboard/primitives";
import { ProfileForm } from "@/components/profile-form";
import { formatDate } from "@/components/dashboard/primitives";
import { getProfileForUser } from "@/lib/services/profile";

/** Photo + details panels shared by the customer and admin profile pages. */
export async function ProfileSections({ userId }: { userId: string }) {
  const profile = await getProfileForUser(userId);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Panel title="Photo">
          <AvatarUploader name={profile.name} currentImage={profile.image} />
        </Panel>
        <Panel
          title="Personal information"
          description="Your name appears on reviews and orders. Your role is managed by an administrator."
        >
          <ProfileForm initialProfile={profile} />
        </Panel>
      </div>

      <Panel title="Account">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-soft">Account type</dt>
            <dd className="font-medium text-foreground">
              {profile.role === "admin" ? "Administrator" : "Customer"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-soft">Email</dt>
            <dd className="break-all font-medium text-foreground">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-muted-soft">Member since</dt>
            <dd className="font-medium text-foreground">
              {formatDate(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
