<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShopSphere Agent Notes

## Working style

- The owner is learning the stack and wants working code. Implement what is asked, then explain the important parts in a few plain sentences so they can follow it.
- Make the smallest change that fully solves the task. Do not refactor unrelated files.
- Never install a package unless the task needs it, and say which package and why.
- Never print, commit, or invent secret values. Refer to `.env.example` for variable names and tell the owner to paste values into `.env` themselves.
- Never claim something was tested if it was not run. Report what was actually run (`tsc`, `lint`, `test`, `build`) and what could not be run.
- Prefer finishing a verified slice over starting several half-finished ones.

## Repo shape and commands

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS v4, Framer Motion, MongoDB, Better Auth, Stripe. Use npm (`package-lock.json` is the only lockfile).
- Routes live in `src/app`. Business logic lives in `src/lib/services`. Database access lives in `src/lib/db`. The `@/*` alias maps to `src/*`.
- Verify changes with `npx next typegen && npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build`. Route types such as `PageProps` only exist after typegen or a build.
- Tests: `npm test` runs pure tests always and database suites only when `MONGODB_URI` is set explicitly in the test process (each suite uses its own throwaway database). Assistant tests are pure and need no database.
- The build route table is the source of truth for whether a route is registered.

## Next.js 16 / Cache Components

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, so pages use partial prerendering.
- Prerendered output must be deterministic. `new Date()`, `Date.now()`, `Math.random()`, and `crypto.randomUUID()` cause blocking-prerender errors. Use a static value, or read request-time data behind `<Suspense>` after `await connection()`.
- Do not use the removed `dynamic`, `revalidate`, `fetchCache`, or `runtime` route config. `force-dynamic` is not the fix for prerender errors.
- Use the generated `PageProps<"/path">` and `LayoutProps<"/path">` types; `params` and `searchParams` are async.

## Styling and motion

- Tailwind v4 is compiled by the `@tailwindcss/turbopack` loader. There is no `tailwind.config.*`; theme tokens live in `src/app/globals.css` (`:root`, `html[data-theme="dark"]`, and `@theme inline`).
- Use the semantic tokens (`bg-surface`, `text-muted`, `border-border`, `bg-accent-solid`, `bg-highlight`) instead of hard-coded colors, so light and dark mode stay in one place.
- Headings use the display font (Bricolage Grotesque) through `globals.css`; body text uses Geist.
- Motion uses Framer Motion through the small components in `src/components/motion/`. `MotionProvider` applies `reducedMotion="user"` for the whole app. Keep automatic motion to the hero; other motion should answer a user action.

## Payments and security rules

- Prices are integer cents and are always recalculated on the server. Never trust a client-sent price or total.
- An order is marked `paid` only by the signed Stripe webhook (`/api/stripe/webhook`). Do not mark orders paid from a redirect or a client call.
- Webhook and refund updates must stay conditional and idempotent.
- Admin pages and admin API routes must call `requireAdminPage` or `requireAdmin`, which re-read the role from MongoDB.
