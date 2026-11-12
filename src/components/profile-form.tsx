"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Alert,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import type { Profile } from "@/lib/types";

/**
 * Name and phone only. The photo is managed by `AvatarUploader`, so this
 * form never sends `image` and cannot overwrite an uploaded photo.
 */
export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initialProfile.name);
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await apiRequest<{ profile: Profile }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, phone: phone || null }),
      });
      setMessage("Profile updated.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update your profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Name
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className={labelClass}>
            Phone <span className="font-normal text-faint">(optional)</span>
          </label>
          <input
            id="profile-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={40}
            autoComplete="tel"
            inputMode="tel"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="profile-email" className={labelClass}>
          Email
        </label>
        <input
          id="profile-email"
          value={initialProfile.email}
          readOnly
          className={`${inputClass} bg-surface-muted text-muted-soft`}
        />
        <p className="mt-1.5 text-xs text-muted-soft">
          {initialProfile.emailVerified
            ? "Your email address is verified. It cannot be changed here."
            : "Your email address is not verified yet. It cannot be changed here."}
        </p>
      </div>

      <div aria-live="polite" className="space-y-2">
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
