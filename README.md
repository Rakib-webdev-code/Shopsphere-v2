# ShopSphere v2

<p align="center">
  **A Modern Full-Stack E-Commerce Platform**
  <br />
  Built with Next.js 16, React 19, TypeScript, MongoDB and Better Auth.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#architecture">Architecture</a>
</p>

---

## Overview

ShopSphere v2 is a full-stack e-commerce application designed to deliver a modern shopping experience with secure authentication, reliable checkout workflows, inventory management, and dedicated customer and admin dashboards.

The project focuses on more than just the shopping interface. It implements important e-commerce engineering practices, including server-side price calculation, stock reservation, payment verification through signed webhooks, role-based authorization, and idempotent order creation.

A guided product experience is also available at `/showcase`.

## Features

### Storefront & Product Discovery

- Dynamic product catalog powered by MongoDB.
- Product search, category filtering, price filtering, sorting, and pagination.
- Product details with image galleries, stock availability, related products, and reviews.
- Responsive interface with light and dark themes.
- Loading skeletons, empty states, and error handling.
- Shopping assistant with catalog-based product recommendations.

### Authentication & User Accounts

- Email and password authentication.
- Google, Facebook, and GitHub sign-in when configured.
- Email verification and password reset through Resend.
- Profile management with secure photo upload.
- Saved addresses, persistent shopping cart, and wishlist.
- Verified-purchase product reviews.
- Customer-specific order history and order tracking.

### Shopping Cart & Checkout

- Persistent cart management.
- Server-side product price and stock validation.
- Coupon validation and discount calculation.
- Shipping fee and order total calculation.
- Conditional stock reservation to prevent overselling.
- Per-user checkout idempotency protection.
- Stripe Checkout for card payments.
- Pay-later checkout when Stripe is not configured.

### Secure Payment Processing

- Stripe Checkout integration.
- Payment confirmation through verified Stripe webhooks.
- Duplicate webhook delivery protection.
- Conditional payment and refund updates.
- Full refunds for eligible paid-order cancellations by admins.
- Card details are handled by Stripe, not stored by the application.

### Customer Dashboard

A dedicated dashboard at `/account` gives customers access to:

| Section | Route |
|---|---|
| Overview | `/account` |
| My Orders | `/account/orders` |
| Order History | `/account/history` |
| Wishlist | `/account/wishlist` |
| Shopping Cart | `/account/cart` |
| Saved Addresses | `/account/addresses` |
| My Reviews | `/account/reviews` |
| Notifications | `/account/notifications` |
| My Profile | `/account/profile` |
| Settings | `/account/settings` |
| Help & Support | `/account/help` |

Dashboard insights include order statistics, paid spending, recent orders, recently purchased products, wishlist summaries, and activity information.

### Admin Dashboard

A separate admin dashboard is available at `/admin`.

- Dashboard overview and analytics.
- Product and category management.
- Order management and status transitions.
- Customer overview.
- Inventory and stock adjustment management.
- Append-only inventory audit records.
- Coupon management.
- Reviews and ratings overview.
- Promotions overview.
- Notifications and system settings.
- Recovery tools for orders requiring inventory-release attention.

### Security & Reliability

- Separate `customer` and `admin` roles.
- Public registration can only create customer accounts.
- Admin authorization is checked against MongoDB on every request.
- Customers can access only their own private account resources.
- Server-calculated prices and checkout totals.
- Conditional inventory updates and transaction-aware operations.
- Signed webhook verification for payment confirmation.
- Upload validation and rate limiting for profile photos.
- Private account and admin responses are not cached as public content.

### Shopping Assistant

Available at `/assistant`, the shopping assistant helps users discover products through natural-language requests.

It supports two modes:

- **Catalog Mode:** Searches and ranks real active catalog products without requiring an external AI provider.
- **AI-Ranked Mode:** Optionally uses an OpenAI-compatible API to rank a bounded list of verified product candidates.

The server validates provider responses and retrieves product information from MongoDB. The assistant is read-only and cannot modify orders, carts, products, or inventory.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Database | MongoDB |
| Authentication | Better Auth |
| Payments | Stripe Checkout & Webhooks |
| Email | Resend |
| Testing | Node.js Test Runner |

## Project Screenshots

Screenshots will be added here as the visual documentation is prepared.

Planned screenshots:

- Homepage and storefront
- Product catalog
- Product details
- Shopping cart and checkout
- Customer dashboard
- Admin dashboard

<!-- Future screenshot paths:
docs/screenshots/homepage.png
docs/screenshots/shop.png
docs/screenshots/product-details.png
docs/screenshots/cart.png
docs/screenshots/checkout.png
docs/screenshots/user-dashboard.png
docs/screenshots/admin-dashboard.png
-->

---

## Getting Started

### Prerequisites

- Node.js 22 or later
- npm
- MongoDB database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Rakib-webdev-code/Shopsphere-v2.git
cd Shopsphere-v2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Configure the required variables:

```dotenv
BETTER_AUTH_SECRET=
MONGODB_URI=
BETTER_AUTH_URL=http://localhost:3000
```

Additional integrations are optional and documented in `.env.example`.

| Environment Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub sign-in |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `APP_URL` | Stripe redirect URL |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email delivery |
| `AI_ASSISTANT_API_KEY` | Optional AI assistant |
| `AI_ASSISTANT_MODEL` | AI model selection |
| `AI_ASSISTANT_BASE_URL` | AI provider endpoint |
| `MONGODB_DB` | Database name; defaults to `shopsphere` |

**Important:** Never commit `.env`, `.env.local`, or any API keys and secrets to GitHub.

### 4. Initialize database indexes

```bash
npm run db:init
```

This script creates the required indexes without deleting existing data. Run it before processing the first checkout.

### 5. Add sample data (optional)

```bash
npm run db:seed
```

The seed process uses insert-only behavior for existing records.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stripe Configuration

To enable card payments:

1. Create a Stripe account.
2. Add your Stripe test secret key to `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
4. Forward webhook events to the local application:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

5. Add the generated webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
6. Restart the development server.

Use Stripe's test card `4242 4242 4242 4242` with any future expiry date and any CVC.

For production, configure the webhook endpoint with the deployed application's HTTPS URL.

## Creating the First Admin

Public sign-up always creates a customer account. Admin access must be granted manually.

1. Register a normal account.
2. Run the following command with the existing user's email:

```bash
npm run admin:promote -- you@example.com
```

The script updates the role of an existing user; it does not create an account.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx next typegen && npx tsc --noEmit` | Run TypeScript checks |
| `npm test` | Run unit and integration tests |
| `npm run test:http` | Run HTTP integration tests |
| `npm run db:init` | Initialize database indexes |
| `npm run db:seed` | Insert sample data |
| `npm run admin:promote -- <email-or-id>` | Promote an existing user to admin |

## Architecture

```text
src/
├── app/
│   ├── account/          Customer dashboard
│   ├── admin/            Admin dashboard
│   ├── api/              API route handlers
│   ├── assistant/        Shopping assistant
│   ├── categories/       Category pages
│   ├── shop/             Product catalog and details
│   └── ...               Other application routes
│
├── components/
│   ├── dashboard/        Shared dashboard components
│   ├── motion/           Animation building blocks
│   └── ...               Shared UI components
│
└── lib/
    ├── assistant/        Assistant logic
    ├── auth/             Authentication helpers
    ├── db/               MongoDB collections and transactions
    └── services/         Business logic and data access

data/                     Product catalog data
docs/                     Project documentation
public/                   Static assets and product images
scripts/                  Database and admin scripts
tests/                    Unit and integration tests
```

## Database & Engineering Notes

- Prices are stored as integer cents.
- Server handlers calculate checkout totals; client-submitted totals are not trusted.
- Product, category, and coupon removal uses soft deactivation.
- Payment status is confirmed through signed Stripe webhooks.
- Inventory adjustments are recorded in an append-only audit collection.
- Customer dashboard queries are scoped to the authenticated user.
- Private account and admin data is protected from public caching.
- Database indexes are defined in the application and mirrored by the initialization scripts.

MongoDB transactions are required for operations such as manual stock adjustments and product creation with initial stock. MongoDB Atlas provides replica-set support.

## Testing & Verification

Run the following checks:

```bash
npx next typegen && npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:http
```

Database integration tests use isolated test databases with the `ss_phase1_test_*` naming convention. Set `MONGODB_URI` explicitly to a database reserved for testing before running database suites.

Without an explicit test database URI, database suites skip rather than operating on a regular application database.

## Deployment Notes

Before deploying:

- Configure all required environment variables in the hosting provider.
- Use MongoDB Atlas or another replica-set deployment.
- Set `BETTER_AUTH_URL` to the public HTTPS application URL.
- Configure OAuth callback URLs for enabled providers.
- Configure Stripe webhook endpoint and signing secret.
- Configure Resend for real email delivery.
- Keep AI provider keys server-side.
- Use a shared rate-limit store for multi-instance assistant deployments.

Never expose server secrets through `NEXT_PUBLIC_*` environment variables.

## Roadmap

Potential future improvements:

- Admin review moderation.
- Admin-created promotional banners.
- Per-notification read state and notification preferences.
- Product recommendations and recently viewed products.
- External object storage for profile photos.
- Order confirmation and shipping emails.
- Admin user-role management.
- Product variants such as size and color.
- Multi-currency support.

---

## Developer

**Md. Rakib**

Full-Stack Web Developer

- GitHub: [Rakib-webdev-code](https://github.com/Rakib-webdev-code)
- Repository: [ShopSphere v2](https://github.com/Rakib-webdev-code/Shopsphere-v2)

---

<p align="center">
  **ShopSphere v2**
  <br />
  Built with care, security, and a focus on real-world e-commerce engineering.
</p>
