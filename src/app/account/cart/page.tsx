import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  EmptyState,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { MediaThumb } from "@/components/product-media";
import { Alert, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FEE_CENTS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getCartForUser } from "@/lib/services/cart";

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: false },
};

export default function AccountCartPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <CartContent />
    </Suspense>
  );
}

async function CartContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const cart = await getCartForUser(user.id);
  const freeShipping = cart.subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Shopping"
        title="Shopping Cart"
        description="A summary of what is in your cart. Change quantities and check out from the full cart."
        actions={
          <Link href="/cart" className={secondaryButtonClass}>
            Edit cart
          </Link>
        }
      />

      {cart.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Your cart is empty"
          description="Add products from the catalog and they will be listed here."
          action={
            <Link href="/shop" className={primaryButtonClass}>
              Browse the catalog
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title={`${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}>
            {cart.hasUnavailableItems ? (
              <div className="mb-4">
                <Alert tone="error">
                  Some items are unavailable or exceed current stock. Review them in
                  the full cart before checking out.
                </Alert>
              </div>
            ) : null}
            <ul className="divide-y divide-border">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-4 py-3.5">
                  <MediaThumb
                    src={item.image}
                    alt=""
                    variant="thumb"
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="block truncate text-sm font-semibold text-foreground hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-soft">
                      {formatPrice(item.priceInCents)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(item.lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  {formatPrice(cart.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Estimated shipping</dt>
                <dd className="font-medium text-foreground">
                  {freeShipping ? "Free" : formatPrice(SHIPPING_FEE_CENTS)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-muted-soft">
              {freeShipping
                ? "You qualify for free shipping. "
                : `Add ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents)} more for free shipping. `}
              Final totals and discounts are calculated by the server at checkout.
            </p>
            <Link
              href="/checkout"
              aria-disabled={cart.hasUnavailableItems}
              className={`${primaryButtonClass} mt-5 w-full ${
                cart.hasUnavailableItems ? "pointer-events-none opacity-60" : ""
              }`}
            >
              Continue to checkout
            </Link>
          </Panel>
        </div>
      )}
    </div>
  );
}
