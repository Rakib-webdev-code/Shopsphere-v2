# Implementation report: dashboards, profile photos and design system

Scope: enhance the existing ShopSphere app in place. No rewrite, no destructive database operation, no change to Better Auth, Stripe, inventory-reservation or idempotency code.

## What was added or changed

**Design system** (`src/app/globals.css`): glass tokens and `glass`, `glass-strong`, `dash-backdrop`, `animate-rise` utilities, light and dark. Storefront header got the glass tokens; the rest of the storefront was not redesigned.

**Dashboard shell** (`src/components/dashboard/`): one shell used by both dashboards. Collapsible desktop sidebar (state kept in `localStorage`, safe if unavailable), slide-in mobile drawer (Escape, backdrop, closes on navigation, `inert` while hidden), grouped Lucide navigation, active-item highlight, user card, back-to-store and Logout, header with breadcrumbs, search, theme toggle, notification bell with count and avatar dropdown. Pure-SVG bar and donut charts (no chart dependency).

**Customer dashboard** (`/account/*`): Overview, My Orders, Order History, Wishlist, Shopping Cart, Saved Addresses (existing), My Reviews, Notifications, My Profile, Settings, Help & Support, Logout. Order detail page is unchanged and sits inside the shell.

**Admin dashboard** (`/admin/*`): Overview, Analytics & Reports, Products, Categories, Orders, Customers, Inventory & Stock, Coupons (existing pages, now in the shell), plus new Reviews & Ratings, Promotions, Notifications, Admin Profile, Settings, Help & Support.

**Profile photo upload**: client-side square crop and resize to 512 px JPEG (strips EXIF), server-side validation by magic bytes, 2 MB cap, declared-type match, per-user rate limit, storage in MongoDB `userAvatars`, owner/admin-only serving route with `private` cache, `nosniff` and a sandbox CSP. Preview, replace and remove supported. No external service needed.

**Services**: `dashboard.ts` (customer totals, monthly spend, activity, notifications, reviews), `admin-insights.ts` (analytics, activity, alerts, reviews, promotions), `avatar.ts`. New API routes: `POST/DELETE /api/profile/avatar`, `GET /api/profile/avatar/[userId]`, `POST /api/notifications/seen`.

**Fixes to existing behaviour (deliberate)**
- Customer "total spent" (old account page and admin customer list) counted every non-cancelled order. It now counts only `paymentStatus: paid`.
- Admin "customers" count included administrators. It now excludes them.
- `apiRequest` forced a JSON `Content-Type` on every body, which would break multipart uploads. It now leaves `FormData` alone.
- The profile form no longer sends an `image` URL field, so saving a name cannot overwrite an uploaded photo.

**Dependency added**: `lucide-react` (requested Lucide icons; the repo only had hand-written SVG icons).

## Verification actually run

Environment: sandbox with a local MongoDB 7 from conda-forge (standalone and single-node replica set). No browser was available.

| Check | Result |
| --- | --- |
| `npx next typegen && npx tsc --noEmit` | Passed |
| `npm run lint` | Passed, no warnings |
| `npm test` (standalone MongoDB, HTTP tests off) | 99 passed, 0 failed, 31 skipped (transaction and HTTP suites) |
| `npm test` with HTTP tests on a replica set (transactions enabled) | **130 passed, 0 failed, 0 skipped** |
| `next build` | Passed, all new routes registered. Run in a scratch copy with `next/font/google` stubbed because the sandbox cannot reach Google Fonts; the shipped `layout.tsx` is unmodified and its build needs internet access |
| Baseline before changes | 104 tests: 82 passed, 0 failed, 22 skipped |

New automated tests: `avatar-validation.test.mjs` (6), `dashboard.test.mjs` (4), `dashboard.integration.test.mjs` (7), `dashboard.http.integration.test.mjs` (9). They cover customer authentication and admin authorization on every dashboard route, no admin content for customers and no shell for anonymous users, customer stats (paid-only spend, cancelled items excluded, per-user isolation), monthly buckets, notification unread/seen, admin analytics (unpaid never counted as revenue, best sellers), avatar upload, ownership, replace, remove, SVG / spoofed type / oversized rejection, and that a rejected upload leaves the user unchanged.

The existing inventory, transaction, idempotency, Stripe and order-ownership suites were run unchanged and pass.

## Not verified or not done

- **Responsive and visual quality was not checked in a browser.** Layout is written mobile-first with Tailwind breakpoints, but nobody has looked at it on a screen. Please check the sidebar drawer, collapsed sidebar and charts on a phone and a wide monitor.
- Real Stripe checkout, Resend email and social sign-in were not exercised (no keys). Password-change and verification-email buttons call Better Auth's client but were not clicked through.
- Auth gates run inside `Suspense`, so protected routes return HTTP 200 with a redirect or not-found payload rather than 302/404. This matches the original architecture; tests assert that no protected content is rendered.
- Storefront pages (home, product list, product detail, cart, checkout, auth pages) keep their existing design apart from the header tweak. A full storefront redesign was not attempted.
- Customer notifications are derived from orders and reviews; there are no per-item read states. Admin notifications are live alerts with no read state.
- Admin review moderation, admin-created promotions, recently viewed and product recommendations are not implemented (listed in the README roadmap).
- Profile photos are stored in MongoDB, which is fine for avatars at this size but is not object storage.
