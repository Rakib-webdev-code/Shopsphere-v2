"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revoke, setRevoke] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (next.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: revoke,
      });

      if (result.error) {
        setError(
          result.error.message ??
            "Unable to change your password. Check your current password.",
        );
        return;
      }

      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage(
        revoke
          ? "Password changed. Other devices were signed out."
          : "Password changed.",
      );
    } catch {
      setError("Unable to change your password. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className={labelClass}>
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className={labelClass}>
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-strong">
        <input
          type="checkbox"
          checked={revoke}
          onChange={(event) => setRevoke(event.target.checked)}
          className="h-4 w-4 rounded border-border-strong accent-[var(--accent-bright)]"
        />
        Sign out of my other devices
      </label>
      <div aria-live="polite" className="space-y-2">
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}

export function ResendVerification({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/account",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to send the email.");
        return;
      }

      setMessage("Verification email sent. Check your inbox.");
    } catch {
      setError("Unable to send the email. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={secondaryButtonClass}
      >
        {pending ? "Sending..." : "Resend verification email"}
      </button>
      <div aria-live="polite" className="space-y-2">
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    </div>
  );
}
