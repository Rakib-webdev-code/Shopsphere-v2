"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Alert,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkIsInvalid = searchParams.get("error") === "INVALID_TOKEN" || !token;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    if (!token) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(result.error.message ?? "Could not reset the password.");
        return;
      }

      router.push("/sign-in?reset=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (linkIsInvalid) {
    return (
      <div className="space-y-4">
        <Alert tone="error">
          This reset link is invalid or has expired. Request a new one to
          continue.
        </Alert>
        <Link
          href="/forgot-password"
          className="block text-center text-sm font-semibold text-accent hover:text-accent-strong"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-muted-soft">Use at least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${primaryButtonClass} w-full`}
      >
        {isSubmitting ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}
