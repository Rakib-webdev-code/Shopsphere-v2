"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Alert,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(result.error.message ?? "Could not send the reset link.");
        return;
      }

      setSent(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          If an account exists for {email}, a reset link is on its way. It
          expires in one hour.
        </Alert>
        <Link
          href="/sign-in"
          className="block text-center text-sm font-semibold text-accent hover:text-accent-strong"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
        {isSubmitting ? "Sending link..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-accent hover:text-accent-strong"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
