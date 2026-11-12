import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CategoryCard } from "@/components/category-card";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@/components/icons";
import { HeroColumn, HeroItem, TagSwing } from "@/components/motion/hero-motion";
import { ProductList, ProductGridSkeleton } from "@/components/product-list";
import { ProductMedia } from "@/components/product-media";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontShell } from "@/components/storefront-shell";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getFeaturedProducts, listProducts } from "@/lib/services/products";
import { listCategories } from "@/lib/services/categories";

const values = [
  {
    title: "Curated, not crowded",
    description: "A focused edit of useful, well-made everyday pieces.",
  },
  {
    title: "Paid for safely",
    description:
      "Card payments run on Stripe. Card details never touch this store.",
  },
  {
    title: "Checked at checkout",
    description:
      "Stock, prices, discounts, and totals are validated again on the server.",
  },
] as const;

const linkClass =
  "inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export default function Home() {
  return (
    <StorefrontShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <HeroColumn>
            <HeroItem>
              <h1 className="max-w-xl text-5xl font-extrabold leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
                Fewer, better things for the way you live.
              </h1>
            </HeroItem>

            <HeroItem>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
                Audio, workspace, home, outdoor and wellness pieces picked for
                how well they are made and how long they last.
              </p>
            </HeroItem>

            <HeroItem className="mt-8 max-w-lg">
              <StorefrontSearch variant="hero" />
            </HeroItem>

            <HeroItem className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-accent-solid px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Shop all products
                <ArrowRightIcon />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center rounded-full border border-border-strong bg-surface px-6 py-3 text-sm font-semibold text-muted-strong transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Explore categories
              </Link>
            </HeroItem>

            <HeroItem>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-soft">
                {[
                  `Free shipping over ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}`,
                  "Secure card checkout",
                  "Totals verified on the server",
                ].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-accent-bright" />
                    {item}
                  </li>
                ))}
              </ul>
            </HeroItem>
          </HeroColumn>

          <Suspense fallback={<ShelfSkeleton />}>
            <HomeShelf />
          </Suspense>
        </div>
      </section>

      <section
        aria-label="Why shop at ShopSphere"
        className="border-b border-border bg-surface"
      >
        <ul className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-9 sm:grid-cols-3 sm:px-6 lg:px-8">
          {values.map((value) => (
            <li key={value.title} className="border-l-2 border-accent-bright pl-4">
              <p className="text-base font-semibold text-foreground">
                {value.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="categories-heading"
        className="border-b border-border py-16 lg:py-20"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2
                id="categories-heading"
                className="text-3xl font-bold text-foreground sm:text-4xl"
              >
                Shop by category
              </h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Small collections, each built around the way everyday spaces
                and routines actually feel.
              </p>
            </div>
            <Link href="/categories" className={linkClass}>
              View all categories
              <ArrowRightIcon />
            </Link>
          </div>

          <Suspense fallback={<CategoryGridSkeleton />}>
            <HomeCategories />
          </Suspense>
        </div>
      </section>

      <section
        aria-labelledby="featured-heading"
        className="bg-surface py-16 lg:py-20"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="featured-heading"
                className="text-3xl font-bold text-foreground sm:text-4xl"
              >
                Featured this week
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                A short list from the live catalog, chosen to show the range
                of the store.
              </p>
            </div>
            <Link href="/shop" className={linkClass}>
              View all products
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="mt-8">
            <Suspense fallback={<ProductGridSkeleton count={4} />}>
              <HomeFeatured />
            </Suspense>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="assistant-heading"
        className="border-t border-border bg-surface py-16"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl bg-accent-soft p-6 ring-1 ring-accent-border sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl">
              <h2
                id="assistant-heading"
                className="text-3xl font-bold text-foreground sm:text-4xl"
              >
                Describe the thing. We will find the shelf.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-strong">
                Ask for a gift under a budget, compare two products, or look
                for an alternative to something that is sold out. Every result
                is checked against the live catalog price and stock before it
                is shown.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {[
                  "No invented products",
                  "Budget-aware suggestions",
                  "Real stock counts",
                ].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-accent-bright" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/assistant"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-solid px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Ask the assistant
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="workspace-heading" className="pb-16 lg:pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 overflow-hidden rounded-3xl bg-strong px-6 py-12 text-strong-foreground sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-14">
            <div className="max-w-2xl">
              <h2
                id="workspace-heading"
                className="text-3xl font-bold sm:text-4xl"
              >
                Make a little more room for focus.
              </h2>
              <p className="mt-4 text-base leading-7 opacity-80">
                Quietly functional pieces for clearer desks, calmer
                afternoons, and work that feels a little less hurried.
              </p>
            </div>
            <Link
              href="/shop?category=workspace"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-highlight px-6 py-3 text-sm font-semibold text-highlight-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-strong"
            >
              Shop the workspace
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}

/**
 * Hero artwork: three products hang from a shelf rail on price tags. The tags
 * are the one animated moment on the page (see hero-motion.tsx).
 */
async function HomeShelf() {
  await connection();
  const featured = await getFeaturedProducts(3);
  const products =
    featured.length >= 3
      ? featured
      : (await listProducts({ pageSize: "3" })).products;

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <p className="text-lg font-semibold text-foreground">
          The catalog is being prepared
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add products through the admin dashboard or run the sample seed
          script to populate the storefront.
        </p>
      </div>
    );
  }

  const tilts = [-2.5, 1.5, -1];
  const offsets = ["sm:mt-8", "sm:-mt-2", "sm:mt-14"];

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-strong/80"
      />
      <ul
        className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-3 sm:gap-5"
        aria-label="Featured products"
      >
        {products.slice(0, 3).map((product, index) => (
          <li
            key={product.id}
            className={`${index === 2 ? "hidden sm:block" : ""} ${offsets[index]}`}
          >
            <TagSwing tilt={tilts[index]} delay={index * 0.12}>
              <Link
                href={`/shop/${product.slug}`}
                className="group relative block rounded-2xl bg-surface p-2.5 shadow-lg shadow-black/10 ring-1 ring-border transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:shadow-black/40"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-strong bg-background"
                />
                <ProductMedia
                  product={product}
                  variant="hero"
                  className="aspect-[4/5] rounded-xl"
                  priority={index === 0}
                />
                <span className="mt-3 block px-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </span>
                  <span className="mt-1.5 inline-block rounded-md bg-highlight px-2 py-0.5 text-sm font-bold text-highlight-foreground">
                    {formatPrice(product.priceInCents)}
                  </span>
                </span>
              </Link>
            </TagSwing>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-strong/30" />
      <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-3 sm:gap-5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`rounded-2xl bg-surface p-2.5 ring-1 ring-border ${index === 2 ? "hidden sm:block" : ""}`}
          >
            <div className="aspect-[4/5] animate-pulse rounded-xl bg-surface-subtle" />
            <div className="mt-3 space-y-2 px-1">
              <div className="h-3 w-24 animate-pulse rounded-full bg-surface-subtle" />
              <div className="h-5 w-14 animate-pulse rounded-md bg-surface-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function HomeCategories() {
  await connection();
  const categories = await listCategories();

  if (categories.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center text-sm text-muted">
        Categories will appear here once they are added in the admin dashboard.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

async function HomeFeatured() {
  await connection();
  const featured = await getFeaturedProducts(4);
  const products =
    featured.length > 0
      ? featured
      : (await listProducts({ pageSize: "4", sort: "newest" })).products;

  return <ProductList products={products} columns={4} />;
}

function CategoryGridSkeleton() {
  return (
    <div
      className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border bg-surface p-2"
        >
          <div className="aspect-[5/3] animate-pulse rounded-xl bg-surface-subtle" />
          <div className="space-y-2 px-3 py-4">
            <div className="h-4 w-28 animate-pulse rounded-full bg-surface-subtle" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-surface-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
