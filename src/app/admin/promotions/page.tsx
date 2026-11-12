import { Megaphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  DashboardSkeleton,
  EmptyState,
  PageIntro,
  Panel,
} from "@/components/dashboard/primitives";
import { secondaryButtonClass } from "@/components/ui";
import { requireAdminPage } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { listPromotionProducts } from "@/lib/services/admin-insights";

export const metadata: Metadata = { title: "Promotions" };

export default function PromotionsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton cards={0} />}>
      <PromotionsContent />
    </Suspense>
  );
}

async function PromotionsContent() {
  await connection();
  await requireAdminPage();

  const products = await listPromotionProducts();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Store"
        title="Promotions"
        description="Products currently shown with a markdown (a compare-at price above the selling price). Edit a product to start or end its promotion. Discount codes are managed under Coupons."
        actions={
          <Link href="/admin/coupons" className={secondaryButtonClass}>
            Manage coupons
          </Link>
        }
      />

      <Panel title={`${products.length} product${products.length === 1 ? "" : "s"} on promotion`}>
        {products.length === 0 ? (
          <EmptyState
            icon={<Megaphone />}
            title="No active promotions"
            description="Set a compare-at price higher than the price on a product to show it as discounted."
            action={
              <Link href="/admin/products" className={secondaryButtonClass}>
                Go to products
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-soft">
                <tr>
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Was</th>
                  <th className="pb-2 text-right font-semibold">Now</th>
                  <th className="pb-2 text-right font-semibold">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const percent = Math.round(
                    (1 - product.priceInCents / product.compareAtPriceInCents) * 100,
                  );

                  return (
                    <tr key={product.id}>
                      <td className="py-3">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {product.name}
                        </Link>
                        {product.badge ? (
                          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                            {product.badge}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-right text-muted line-through">
                        {formatPrice(product.compareAtPriceInCents)}
                      </td>
                      <td className="py-3 text-right font-semibold text-foreground">
                        {formatPrice(product.priceInCents)}
                      </td>
                      <td className="py-3 text-right font-semibold text-accent">
                        {percent}% off
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
