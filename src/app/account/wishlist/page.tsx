import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  EmptyState,
  PageIntro,
} from "@/components/dashboard/primitives";
import { ProductCard } from "@/components/product-card";
import { WishlistRemoveButton } from "@/components/wishlist-remove-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getWishlistForUser } from "@/lib/services/wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default function AccountWishlistPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <WishlistContent />
    </Suspense>
  );
}

async function WishlistContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const wishlist = await getWishlistForUser(user.id);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Shopping"
        title="Wishlist"
        description="Saved products stay with your account. Inactive or removed products no longer appear."
      />

      {wishlist.products.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Your wishlist is empty"
          description="Open a product and choose “Save to wishlist” to keep it here."
          action={
            <Link
              href="/shop"
              className="rounded-full bg-accent-solid px-4 py-2 text-sm font-semibold text-white hover:bg-accent-solid-hover"
            >
              Browse the catalog
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {wishlist.products.length}{" "}
            {wishlist.products.length === 1 ? "saved product" : "saved products"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {wishlist.products.map((product) => (
              <div key={product.id} className="flex flex-col">
                <ProductCard product={product} />
                <div className="px-3 pt-2 text-right">
                  <WishlistRemoveButton productId={product.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
