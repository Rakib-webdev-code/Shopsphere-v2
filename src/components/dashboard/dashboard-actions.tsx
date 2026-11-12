"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, dangerButtonClass, secondaryButtonClass } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      await apiRequest("/api/notifications/seen", { method: "POST" });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to mark notifications as read.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        className={secondaryButtonClass}
      >
        {pending ? "Saving..." : "Mark all as read"}
      </button>
      {error ? (
        <div className="mt-2">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}

export function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/reviews/${reviewId}`, { method: "DELETE" });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the review.",
      );
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={dangerButtonClass}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm delete">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={dangerButtonClass}
      >
        {pending ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className={secondaryButtonClass}
      >
        Keep
      </button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </div>
  );
}
