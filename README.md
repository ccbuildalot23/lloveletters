# Provenant Rugs — one-of-a-kind hand-knotted Turkish rugs

Static Astro storefront on **Cloudflare Pages**, with **Pages Functions** for checkout, reservations, forms, and admin. Built from `BUILD_SPEC.md` (the Storefront Build Prompt). Brand rationale in `docs/BRAND.md`; pricing bands in `docs/PRICING.md`. Everything in `[BRACKETS]` and every `[EDIT]` marker is a placeholder for Chris to replace.

> **Sample data:** the eight rugs in `src/data/products.json` are marked `SAMPLE` and use placeholder SVGs. Replace them before launch (see _Catalog_ below).

## Stack

| Layer     | Choice                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Site      | Astro 7 (static), Tailwind CSS 4, TypeScript strict, vanilla-TS islands (filters, search, cart, gallery, forms)                                                    |
| Server    | Cloudflare Pages Functions (`/functions`, TypeScript)                                                                                                              |
| Data      | `src/data/products.json` (build) · KV `RUG_STATUS` (live availability) · D1 `DB` (forms, orders, reservations, reviews, audit) · R2 `UPLOADS` (room/review photos) |
| Media     | Cloudflare Images (`thumb/card/gallery/zoom/og/blur` variants) · Cloudflare Stream                                                                                 |
| Payments  | Stripe Checkout Sessions (server-created), Stripe Tax, Apple/Google Pay, promo codes, optional Affirm/Klarna                                                       |
| Email     | Admin notifications via Resend / Postmark / MailChannels (pluggable) · marketing via Kit or Klaviyo (pluggable)                                                    |
| Spam      | Cloudflare Turnstile on every form + honeypot + KV rate limit                                                                                                      |
| Analytics | Cloudflare Web Analytics · GA4 · Meta Pixel + Conversions API (server) · single `track()` helper                                                                   |
| Tests     | Vitest · Playwright (+ axe-core) · Lighthouse CI · size budgets                                                                                                    |

## Quick start (local)

```bash
nvm use                     # Node 22.12+
npm install
cp .dev.vars.example .dev.vars   # fill in TEST keys; never commit this file
npm run dev                 # Astro dev server (static pages, no Functions) → http://localhost:4321
```

To run the full stack (Functions + local D1/KV/R2):

```bash
npm run build
npm run db:migrate:local
npm run preview             # wrangler pages dev ./dist → http://localhost:8788
```

Useful scripts:

| Command                                                                                   | Purpose                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `npm run validate-catalog`                                                                | Zod-validate `products.json` (also runs before every build)   |
| `npm run new-rug`                                                                         | Interactive CLI that appends a validated rug                  |
| `npm run certificate -- TR-0042` (or `--all`)                                             | Generate branded certificate PDFs into `public/certificates/` |
| `npm run upload-media -- ./media/rug-TR-0042/`                                            | Upload images/videos to Cloudflare Images/Stream, print IDs   |
| `npm run pull-airtable`                                                                   | Replace `products.json` from Airtable (Phase 2 catalog)       |
| `npm test` · `npm run test:e2e` · `npm run test:a11y` · `npm run lhci` · `npm run budget` | See `TESTING.md`                                              |
| `npm run check` · `npm run lint` · `npm run format`                                       | astro check + tsc (functions), ESLint, Prettier               |

## Setup guide (production)

Do these in order. Nothing secret goes in the repo: local secrets live in `.dev.vars`, production secrets in `wrangler pages secret put NAME` or the Pages dashboard (Settings → Environment variables, mark as _Secret_).

### 1. Cloudflare account and Pages project

1. Add `[DOMAIN]` to Cloudflare (DNS). Turn on **Always Use HTTPS** and **HSTS** (`_headers` already sends HSTS; enable _HSTS preload_ only once you are sure).
2. **Workers & Pages → Create → Pages → Connect to Git** → this repo. Build command `npm run build`, output directory `dist`, production branch `main`. Preview deployments on every PR are on by default.
3. Build environment variables (Pages → Settings → Environment variables, _Production_ and _Preview_): every `PUBLIC_*` value from `wrangler.toml` (`PUBLIC_SITE_URL`, `PUBLIC_BRAND_NAME`, `PUBLIC_DEALER_NAME`, `PUBLIC_PHONE`, `PUBLIC_WHATSAPP`, `PUBLIC_EMAIL`, `PUBLIC_ADDRESS`, `PUBLIC_BOOKING_URL`, socials), plus `LAUNCH_MODE`, `SOLD_INDEX_DAYS`, `CF_IMAGES_HASH`, `PUBLIC_TURNSTILE_SITEKEY`, `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_CF_BEACON_TOKEN`, `PUBLIC_HERO_STREAM_ID`, `PUBLIC_FOUNDER_STREAM_ID`, `PUBLIC_BNPL_ENABLED`, `PUBLIC_CONSENT_BANNER`, `NODE_VERSION=22`. The Astro build reads these; Functions read `wrangler.toml [vars]` + secrets.

### 2. D1, KV, R2

```bash
npx wrangler login
npx wrangler d1 create rug-store            # paste database_id into wrangler.toml
npx wrangler kv namespace create RUG_STATUS # paste id into wrangler.toml
npx wrangler r2 bucket create rug-store-uploads
npm run db:migrate:remote                   # applies migrations/0001_init.sql
```

Then in Pages → Settings → Functions → **Bindings**, confirm `DB`, `RUG_STATUS`, `UPLOADS` (wrangler.toml with `pages_build_output_dir` configures these automatically on deploy).

### 3. Images and Stream

1. **Images → Variants**: create `thumb` (400w), `card` (800w), `gallery` (1600w), `zoom` (2800w), `og` (1200×630 cover), `blur` (40w, blur 20). Fit _scale-down_, metadata _none_.
2. Copy the **Account hash** into `CF_IMAGES_HASH` (build env + `[vars]`).
3. **Stream**: enable; upload via dashboard or `npm run upload-media`. Set _Allowed origins_ to `[DOMAIN]`.
4. Hero loop: upload a 10–20 s muted loop; set `PUBLIC_HERO_STREAM_ID`. Founder video: `PUBLIC_FOUNDER_STREAM_ID`. Poster images: replace `sample-hero-poster` / `sample-founder` / `sample-signature` references in `src/components/home/Hero.astro`, `MeetChris.astro`, `about.astro` with real image IDs.

### 4. Stripe

1. Activate the account (business details, bank). **Settings → Tax**: enable **Stripe Tax**, set the origin address to `[ADDRESS]`, and **register in your home state** now. Monitor economic nexus in the Tax dashboard (Stripe alerts you near thresholds; most states use $100k of sales, a few still use 200 transactions).
2. **Payment methods**: cards, Apple Pay, Google Pay (domain verification is automatic for Checkout), Link. Enable **Affirm** and **Klarna** if you want BNPL, then set `PUBLIC_BNPL_ENABLED=true`.
3. **Developers → API keys**: `wrangler pages secret put STRIPE_SECRET_KEY` (test key for Preview, live key for Production).
4. **Webhook**: add endpoint `https://[DOMAIN]/api/stripe-webhook` with events `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`. `wrangler pages secret put STRIPE_WEBHOOK_SECRET`.
5. **Trade discount**: Products → Coupons → create a 15% coupon, then a promotion code per approved designer (restrict to the customer where possible). Put your generic trade code in `TRADE_PROMO_CODE` so orders are tagged `is_trade`.
6. Check the API version pinned in `functions/_lib/stripe.ts` matches your dashboard (or remove the pin).

**Test-mode walkthrough**

```bash
npm run build && npm run db:migrate:local
LAUNCH_MODE=live npx wrangler pages dev ./dist --port 8788 --binding LAUNCH_MODE=live
stripe listen --forward-to localhost:8788/api/stripe-webhook   # copy whsec_ into .dev.vars
```

Open `http://localhost:8788/rugs/<slug>` → **Buy now** → pay with `4242 4242 4242 4242`. Expect: rug shows _Sold_ within 10 s on every page (`/api/status`), an `orders` row in D1 (`wrangler d1 execute DB --local --command "select * from orders"`), the admin email, and a deploy-hook call. Cancel a checkout and wait 30 minutes (or trigger `checkout.session.expired` with `stripe trigger`) → rug returns to _Available_. Run the race test: `E2E_BASE_URL=http://127.0.0.1:8788 npx playwright test --project=api`.

### 5. Turnstile

Turnstile → Add site → `[DOMAIN]` (+ `localhost` for dev), widget mode _Managed_/_Non-interactive_. `PUBLIC_TURNSTILE_SITEKEY` in build env; `wrangler pages secret put TURNSTILE_SECRET`. The test keys in `.dev.vars.example` always pass.

### 6. Email

- **Admin notifications**: set `ADMIN_EMAIL_PROVIDER` (`resend` | `postmark` | `mailchannels`) in `[vars]`, `ADMIN_EMAIL`, `ADMIN_EMAIL_FROM` (a verified sender), and secret `ADMIN_EMAIL_API_KEY`.
- **Marketing list**: `EMAIL_PROVIDER` (`kit` | `klaviyo`), secret `EMAIL_API_KEY`, `EMAIL_LIST_ID` (Kit form ID or Klaviyo list ID). Enable **double opt-in** in the provider. Build the 3-email welcome series there, not in code.
- **Tags written by the site**: `waitlist`, `size:<bucket>`, `style:<style>` (interests), `customer`, `bought:<rugId>`; source is recorded as `waitlist` or `checkout`. Verify the Kit/Klaviyo endpoints in `functions/_lib/email.ts` against current docs before launch.
- Post-purchase review link: `https://[DOMAIN]/reviews?token=<id>.<hmac>#write` — generate tokens with `reviewToken()` in `functions/_lib/tokens.ts` (set `REVIEW_TOKEN_SECRET`). Hook this into your post-delivery email.

### 7. Analytics

`PUBLIC_CF_BEACON_TOKEN` (Web Analytics), `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, secret `META_CAPI_TOKEN`. Marketing tags load after first interaction or 3 s, never with GPC/DNT, and only after consent if `PUBLIC_CONSENT_BANNER=true`. Debug with `?debug_analytics=1`. Consider Cloudflare Zaraz later.

### 8. Deploy hook

Pages → Settings → Builds → **Deploy hooks** → create one for `main`. `wrangler pages secret put DEPLOY_HOOK_URL`. Sales, review approvals, and the admin **Rebuild** button call it (debounced to once per 5 min).

### 9. Custom domain

Pages → Custom domains → add `[DOMAIN]` and `www.[DOMAIN]`. Then **Bulk Redirects** (or a redirect rule): `www.[DOMAIN]/*` → `https://[DOMAIN]/$1` 301. Update `PUBLIC_SITE_URL`.

### 10. Cloudflare Access for `/admin`

Zero Trust → Access → Applications → Self-hosted: `[DOMAIN]/admin` and `[DOMAIN]/api/admin`. Policy: Allow emails `[CHRIS EMAIL]`. Copy the **Application Audience (AUD) tag** into secret `ADMIN_ACCESS_AUD` and your team domain (e.g. `yourteam.cloudflareaccess.com`) into `ADMIN_ACCESS_TEAM_DOMAIN`. Functions verify the `Cf-Access-Jwt-Assertion` JWT on every admin request (`functions/_lib/access.ts`); on `localhost` without Access configured, admin is open for development.

### 11. Google

- **Business Profile** with the US address; put the review link in `PUBLIC_GOOGLE_REVIEW_URL`.
- **Merchant Center**: add the feed `https://[DOMAIN]/feed.xml` (RSS, `identifier_exists=no`). Free listings first.
- **Search Console**: submit `https://[DOMAIN]/sitemap-index.xml`.

## Catalog

**Phase 1 (now):** edit `src/data/products.json` (schema in `src/lib/schema.ts`, Section 7.1). `npm run new-rug` walks you through every field; `npm run validate-catalog` fails the build on bad data (forbidden `compareAtUsd`, "silk" without silk fiber, "investment", missing flip video, wrong size bucket…). Commit → Pages rebuilds.

**Phase 2 (Airtable):** create a base **Rug Catalog** with a table **Rugs** and these fields (names are case-sensitive):

| Field                                                                                                                                                                      | Type                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `id` (TR-0042), `slug`, `title`                                                                                                                                            | single line text                                               |
| `style`, `condition`, `sizeBucket`, `construction`, `dyeType`, `region`, `status`                                                                                          | single select (values as in `src/lib/catalog-constants.ts`)    |
| `widthFt`, `lengthFt`, `widthCm`, `lengthCm`, `kpsi`, `pileHeightMm`, `weightKg`, `priceUsd`, `ageYears`                                                                   | number                                                         |
| `era`, `pileFiber`, `foundationFiber`, `fiberContentLabel`, `knotType`, `village`, `workshop`, `shippingNote`, `careLevel`, `certificatePdf`, `seoTitle`, `seoDescription` | single line text                                               |
| `weaverNote`, `sourcingNote`, `conditionNotes`, `description`                                                                                                              | long text                                                      |
| `collection`, `colors`, `tags`                                                                                                                                             | long text containing JSON arrays or comma lists                |
| `images`, `videos`                                                                                                                                                         | long text containing JSON arrays (same shape as products.json) |
| `dutiesIncluded`, `publish`                                                                                                                                                | checkbox                                                       |
| `dateAdded`, `soldAt`                                                                                                                                                      | date                                                           |

`AIRTABLE_TOKEN` (personal access token, `data.records:read`) and `AIRTABLE_BASE_ID` as build env vars; add `npm run pull-airtable &&` in front of the Pages build command. An Airtable automation ("when `publish` changes → run script → `fetch(DEPLOY_HOOK_URL, {method:'POST'})`") publishes.

**Media workflow:** shoot per Section 3.7 (front, back, 2 corners, fringe, macro, room, person-for-scale, lifestyle; flip video). Put files in `media/rug-TR-0042/` named `front.jpg`, `back.jpg`, `corner-1.jpg`, …, `flip.mp4`, `workshop.mp4`. Run `CF_ACCOUNT_ID=… CF_API_TOKEN=… npm run upload-media -- ./media/rug-TR-0042/` and paste the printed JSON into the rug entry (write real alt text). Then `npm run certificate -- TR-0042`.

**Reviews pipeline:** reviews are submitted to D1 as `pending`, moderated at `/admin/reviews`, and exported by `GET /api/admin/reviews-export` (Access-protected). To publish them statically, add a build step that fetches that endpoint with a service token and writes `src/data/reviews.json` (or paste manually). Sections stay hidden until 3 approved reviews exist. Never seed fake reviews.

## Architecture notes

- **One-of-one lock (8.5):** `POST /api/checkout` → KV status check → `INSERT OR IGNORE INTO reservations` (PRIMARY KEY `rug_id`) → exactly one of two parallel buyers gets `changes=1`; the other gets **409**. KV mirrors `reserved` (30-min TTL). Stripe session `expires_at` matches. The webhook marks `sold` (no TTL), writes the order, fires CAPI `Purchase` (dedup `event_id` = session id), syncs the buyer if they consented, emails you, and calls the deploy hook. `checkout.session.expired` releases the hold. Refunds alert you; relisting is manual in `/admin`.
- **Prices** always come from the built `rugs-index.json` on the server, never from the client.
- **Live status** (`GET /api/status?ids=`) is edge-cached 10 s; product, collection, and cart islands re-check on load and on tab focus. `public/api/status` is a `{}` fallback so static previews without Functions don't error.
- **Routes:** `public/_routes.json` limits Functions to `/api/*`, `/admin*`, and `/rugs/TR-*` (ID → slug 301). Everything else is static.
- **Security:** CSP and headers in `public/_headers`; webhook signatures verified; uploads sniffed by magic bytes, ≤10 MB, EXIF stripped for JPEG/PNG (HEIC is stored as-is: strip on your phone or convert to JPEG before upload if that matters to you); rate limits in KV; no PII in logs.
- **LAUNCH_MODE=waitlist:** hides prices site-wide ("Price revealed at launch"), swaps CTAs for the drop list, removes the cart, and `/api/checkout` returns 403. Flip to `live` in both build env and `[vars]`.
- **Sold rugs** stay indexed for `SOLD_INDEX_DAYS` (90) with `SoldOut` availability, then get `noindex` and leave the sitemap.

## Launch checklist

- [ ] Replace every `[BRACKET]` and `[EDIT]` (grep the repo). Brand name, dealer name, address, phone/WhatsApp, email, booking URL, socials, returns shipping choice (`site.returnShipping`), tariff paragraph on `/shipping-duties`.
- [ ] Real catalog in `products.json` (no `sample: true`), real media IDs, alt text, transcripts, certificates generated and committed (or served from R2).
- [ ] Hero/founder videos and poster images; signature image at `public/signature.png` (used on certificates) and `sample-signature` replaced.
- [ ] Legal review of `/privacy`, `/terms`, `/returns`, `/accessibility`. FTC: fiber content, "Imported from Turkey", dealer name are rendered on every product page and in the feed.
- [ ] Stripe live keys, Stripe Tax registered in home state, live webhook endpoint added and secret set, promo codes for trade.
- [ ] Turnstile production keys; email providers configured and a test lead flows through (D1 row + provider + admin email).
- [ ] `LAUNCH_MODE=live` when opening sales (keep `waitlist` for the pre-launch page).
- [ ] Cloudflare Access on `/admin` confirmed: incognito visit to `/admin` must prompt for login; `/api/admin/inventory` returns 401 without it.
- [ ] Production smoke test: buy a $1 test rug? (Stripe live has no test cards: place a real order for a low-priced item and refund it.) Confirm sold status propagates, order row, email, rebuild.
- [ ] `npm run lhci` on the production URL ≥ 95/100/100/100; axe suite green; `TESTING.md` screen reader smoke tests done.
- [ ] Search Console + Merchant Center feed submitted; Web Analytics, GA4 DebugView, and Meta Test Events show each event once (purchase deduped).
- [ ] CAN-SPAM: provider emails carry the postal address and unsubscribe link.

## Repo map

```
src/pages            routes (Astro), incl. rugs-index.json / search-index.json / feed.xml / robots.txt endpoints
src/components       ui/ · forms/ · layout/ · product/ · collection/ · home/ · search/ · cart/
src/scripts          client islands (analytics, forms, filters, search, cart, gallery, product, overlays…)
src/lib              schema (Zod), catalog, site config, jsonld, images, format, tokens, contrast
src/data             products.json (catalog), rooms.json, reviews.json
functions            Pages Functions: api/* (status, checkout, stripe-webhook, order, health, forms/*, admin/*), admin/ guard, rugs/[slug] redirect, _lib/*
migrations           D1 SQL
scripts              validate-catalog, new-rug, sample-products, make-placeholders, pull-airtable, certificate, upload-media, check-budgets
tests                unit (vitest) · e2e (playwright: site, a11y, keyboard, reflow, api)
public               _headers, _redirects, _routes.json, fonts, placeholders, favicon, manifest
```
