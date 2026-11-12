import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/components/dashboard/primitives";
import { OrderStatusBadge } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { OrderSummary, PaymentStatus } from "@/lib/types";

const paymentLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  failed: "Payment failed",
  refunded: "Refunded",
};

const paymentTone: Record<PaymentStatus, string> = {
  paid: "text-accent",
  unpaid: "text-muted-soft",
  failed: "text-danger",
  refunded: "text-info",
};

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="group flex flex-wrap items-center justify-between gap-3 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-accent">
                {order.orderNumber}
              </p>
              <p className="mt-0.5 text-xs text-muted-soft">
                {formatDate(order.createdAt)} · {order.itemCount}{" "}
                {order.itemCount === 1 ? "item" : "items"} ·{" "}
                <span className={paymentTone[order.paymentStatus]}>
                  {paymentLabels[order.paymentStatus]}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="min-w-20 text-right text-sm font-semibold text-foreground">
                {formatPrice(order.totalCents)}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 text-muted-soft transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
