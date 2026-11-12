import { Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  EmptyState,
  formatDate,
  PageIntro,
  Panel,
  StatCard,
} from "@/components/dashboard/primitives";
import { requireAdminPage } from "@/lib/auth/session";
import { listReviewsForAdmin } from "@/lib/services/admin-insights";
import { firstSearchParam } from "@/lib/validation";

export const metadata: Metadata = { title: "Reviews & Ratings" };

export default function AdminReviewsPage(props: PageProps<"/admin/reviews">) {
  return (
    <Suspense fallback={<DashboardSkeleton cards={2} />}>
      <ReviewsContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ReviewsContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/reviews">["searchParams"];
}) {
  await connection();
  await requireAdminPage();

  const params = await searchParams;
  const low = firstSearchParam(params.filter) === "low";
  const { rows, total, average } = await listReviewsForAdmin(low ? 2 : undefined);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Store"
        title="Reviews & Ratings"
        description="Customer reviews across the catalog. Customers can edit or delete their own reviews; there is no admin moderation action in this version."
        actions={
          <nav aria-label="Review filter" className="flex gap-2">
            {[
              { href: "/admin/reviews", label: "All", active: !low },
              { href: "/admin/reviews?filter=low", label: "1–2 stars", active: low },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                aria-current={chip.active ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  chip.active
                    ? "border-accent-border bg-accent-soft text-accent-strong"
                    : "border-border bg-surface/70 text-muted-strong hover:bg-surface-muted"
                }`}
              >
                {chip.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total reviews" value={String(total)} icon={<Star />} />
        <StatCard
          label="Average rating"
          value={total > 0 ? `${average.toFixed(2)} / 5` : "No reviews"}
          icon={<Star />}
          tone="warning"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title="No reviews to show"
          description="Reviews appear here as customers post them."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((review) => (
            <Panel key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {review.productSlug ? (
                    <Link href={`/shop/${review.productSlug}`} className="hover:text-accent">
                      {review.productName}
                    </Link>
                  ) : (
                    review.productName
                  )}
                </p>
                <p className="text-xs text-muted-soft">
                  {review.author} · {formatDate(review.createdAt)}
                  {review.verifiedPurchase ? " · Verified purchase" : ""}
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
                    className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-border-strong"}`}
                  />
                ))}
              </p>
              {review.title ? (
                <p className="mt-2 text-sm font-semibold text-foreground">{review.title}</p>
              ) : null}
              <p className="mt-1 text-sm leading-6 text-muted">{review.body}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
