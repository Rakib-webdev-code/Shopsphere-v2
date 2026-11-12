import { BadgeCheck, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReviewDeleteButton } from "@/components/dashboard/dashboard-actions";
import {
  DashboardSkeleton,
  EmptyState,
  formatDate,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { MediaThumb } from "@/components/product-media";
import { secondaryButtonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { listReviewsForCustomer } from "@/lib/services/dashboard";

export const metadata: Metadata = {
  title: "My Reviews",
  robots: { index: false, follow: false },
};

export default function AccountReviewsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <ReviewsContent />
    </Suspense>
  );
}

async function ReviewsContent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const reviews = await listReviewsForCustomer(user.id);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Shopping"
        title="My Reviews"
        description="Reviews you have written. Open a product to edit a review; you can delete one here."
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title="No reviews yet"
          description="After you receive a product, review it from its product page to help other shoppers."
          action={
            <Link href="/account/history" className={secondaryButtonClass}>
              See delivered orders
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Panel key={review.id}>
              <div className="flex gap-4">
                <MediaThumb
                  src={review.productImage}
                  alt=""
                  variant="thumb"
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {review.productName}
                    </p>
                    <p className="text-xs text-muted-soft">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <p
                    className="mt-1 flex items-center gap-0.5 text-warning"
                    role="img"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        aria-hidden="true"
                        className={`h-4 w-4 ${
                          index < review.rating ? "fill-current" : "text-border-strong"
                        }`}
                      />
                    ))}
                    {review.verifiedPurchase ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                        <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                        Verified purchase
                      </span>
                    ) : null}
                  </p>
                  {review.title ? (
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {review.title}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm leading-6 text-muted">{review.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {review.productSlug ? (
                      <Link
                        href={`/shop/${review.productSlug}`}
                        className={secondaryButtonClass}
                      >
                        Edit on product page
                      </Link>
                    ) : null}
                    <ReviewDeleteButton reviewId={review.id} />
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
