# stressless (Next.js)

Scan-and-go in-store shopping as an installable web app. One Next.js 15 (App Router) + React 19 + TypeScript codebase serves customers, exit staff, managers, store owners and the Super Admin, with the same glass design as the landing page on every screen.

Plan and requirements: `docs/Project Document.md` (written for Nuxt; this build swaps the framework only, see "What changed from the Nuxt build").

## What is built

| Area | Where | Covers |
| --- | --- | --- |
| Customer app | `src/app/page.tsx`, `sign-in`, `(customer)/store`, `store/[token]`, `scan`, `cart`, `pay`, `exit-pass/[orderId]`, `orders`, `orders/[id]` | FR-C1 to FR-C8 |
| Store dashboard | `src/app/(staff)/admin/*` (dashboard, stores, products, inventory, orders, order detail, exit, spot checks, staff, reports) | FR-A1 to FR-A9 |
| Platform portal | `src/app/(staff)/platform/*` (overview, owners, stores, reports, settings) | FR-P1 to FR-P4 |
| API | `src/app/api/**/route.ts` (44 route handlers) | the route outline in section 11 of the plan |
| Server code | `src/server` (`db`, `services`, `utils`, `kit.ts`) | schema, Paystack, DropAphi wrapper, idempotent payment confirmation, owner scoping |
| Shared | `src/shared` | Zod schemas, pricing and the order state machine, used by client and server |
| Design | `src/app/globals.css`, `src/components/Backdrop.tsx` | glass panels over the store-aisle background |

## Set up

Prerequisites: Node 20+, pnpm, a Neon project.

```bash
pnpm install
cp .env.example .env     # fill in the values
pnpm db:migrate          # generates the first migration (commit src/server/db/migrations) and applies it
pnpm db:seed             # Super Admin, demo owner, store, staff and 12 products
pnpm dev                 # http://localhost:3000
```

* **Sign-in codes in development:** with no `DROPAPHI_API_KEY`, emails and SMS are printed in the terminal running `pnpm dev`. Copy the 6-digit code from there.
* **Payments in development:** with no `PAYSTACK_SECRET_KEY`, checkout shows a "Simulate successful payment" button that runs the same code path as the real webhook.
* **Camera on a phone needs HTTPS:** `next dev --experimental-https` or a tunnel.
* **Push alerts:** generate a VAPID key pair with `pnpm exec web-push generate-vapid-keys` and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and a `VAPID_SUBJECT` such as `mailto:admin@your-domain`. Push requires HTTPS (localhost is allowed for development); owners and managers can enable it from the in-app Alerts menu.
* **Demo logins (all by emailed code):** your `SUPER_ADMIN_EMAIL`, `owner@demo.stressless.test`, `manager@demo.stressless.test`, `exit@demo.stressless.test`. Demo store entrance: `/store/demo-store`. Any other email or phone becomes a customer.

## Production

1. `pnpm build && pnpm start` (or deploy to any Node host or Vercel; everything uses the Node runtime).
2. Run `pnpm db:migrate` on deploy (use a Neon branch for staging).
3. Set every variable from `.env.example`. `SESSION_PASSWORD` must be 32+ characters, and `APP_URL` must be your public URL.
4. Register the Paystack webhook: `APP_URL/api/webhooks/paystack`.

## Tests

* `pnpm test`: unit tests for pricing and tax, the order state machine, CSV import and sign-in validation.
* `pnpm test:e2e`: Playwright smoke tests. Set `E2E_DB=1` with a seeded database for the sign-in journey.

## How it fits together

* **Auth:** a signed, HTTP-only cookie (`jose`, 7 days). `src/middleware.ts` keeps each area to its roles (customers, staff, platform) and sends signed-out visitors to `/sign-in?next=...`. API routes check the role again on every request.
* **Route handlers** are wrapped in `route()` (`src/server/utils/http.ts`): JSON in and out, `fail(status, message)` becomes a clean error response, anything else becomes a generic 500.
* **Owner isolation:** every admin route resolves a scope (`adminScope` in `src/server/utils/auth.ts`) and filters by owner; managers are limited to their stores. A Super Admin opens a read-only support view with `?ownerId=`, and each view is written to `activity_log`.
* **Payment** is confirmed only by the signature-verified Paystack webhook. It is idempotent, checks the amount, decrements stock in one transaction, and handles a payment that arrives after the order timed out.
* **Exit passes** are random, tied to one order and one store, and consumed on the first verify or flag. The token is only returned to the customer for paid, unused orders.
* **Suspending an owner** is checked at sign-in, session start, scan, checkout and every admin request, so their stores stop immediately.
* **Money** is stored as integer kobo (NGN only). Tax is one per-store rate.
* **PWA:** `src/app/manifest.ts`, icons in `public/`, and a service worker (`public/sw.js`) that supports offline shell caching and push alerts. API calls are never cached.

## What changed from the Nuxt build

Same data model, API surface, rules and design. Differences: Nitro routes became Next route handlers, Pinia became React context (`src/lib/cart.tsx`, `session.tsx`), `nuxt-auth-utils` became a `jose` cookie, the env var `NUXT_SESSION_PASSWORD` is now `SESSION_PASSWORD`, and Tailwind/Nuxt UI are not used (the design is plain CSS in `globals.css`).

## Needs your confirmation

* `src/server/services/dropaphi.ts`: file uploads use `POST /api/v1/files/upload` with the `DROP-API-Key` header and JSON `name`, `type`, base64 `data`, and public-visibility metadata. The SMS endpoint still needs confirmation. Nothing else talks to DropAphi.
* `src/server/utils/id.ts`: resolves the `dropid` export defensively because its README mixes import names; it falls back to a secure generator of the same `prefix_hex` shape.
* Open items from the plan: restricted-item rules, refund policy, shared vs per-store catalogue (this build uses one catalogue per owner with stock per store).
* Rate limiting is in-memory (one Node instance). Use a shared store if you run several.

## Status of this build
