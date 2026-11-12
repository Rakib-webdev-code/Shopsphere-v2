"use client";

import { useState } from "react";
import { Alert, primaryButtonClass } from "@/components/ui";
import { ApiClientError, apiRequest } from "@/lib/api-client";

type PayNowButtonProps = {
  orderId: string;
  label?: string;
};

export function PayNowButton({ orderId, label = "Pay now" }: PayNowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setError(null);
    setIsLoading(true);

    try {
      const { url } = await apiRequest<{ url: string }>(
        `/api/orders/${orderId}/pay`,
        { method: "POST" },
      );
      window.location.assign(url);
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Payment could not be started. Please try again.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startPayment}
        disabled={isLoading}
        className={primaryButtonClass}
      >
        {isLoading ? "Opening secure payment..." : label}
      </button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
