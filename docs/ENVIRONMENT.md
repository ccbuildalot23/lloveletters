# Environment and configuration ownership

Every variable the code reads, who reads it, how sensitive it is, where it lives in production, and how to verify it. Secret **values** never appear in the repo, in this document, or in chat.

Adding a secret to an agent session does **not** install it into GitHub Actions or the Cloudflare Pages runtime. Account IDs are identifiers, not secrets. D1/KV/R2 resources and their bindings are a separate requirement from any variable below.

## Destinations

| Destination                                                         | What goes there                                                                                                                                                                    | How to set                                                                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GitHub Actions (deploy workflow only)                               | `CLOUDFLARE_API_TOKEN` (secret, Pages:Edit scope), `CLOUDFLARE_ACCOUNT_ID` (identifier, stored as a secret for convenience), repository variables `PUBLIC_SITE_URL`, `LAUNCH_MODE` | Repo → Settings → Secrets and variables → Actions                                                                        |
| Cloudflare Pages runtime, **Preview** and **Production** separately | Everything under _Functions secrets_ below; `[vars]` from `wrangler.toml` are applied automatically on deploy                                                                      | `wrangler pages secret put NAME` (asks for the environment) or Pages → Settings → Environment variables, marked _Secret_ |
| Astro build environment (Pages build settings)                      | Every `PUBLIC_*` value plus `LAUNCH_MODE`, `SOLD_INDEX_DAYS`, `CF_IMAGES_HASH`, `NODE_VERSION=22`, `CERTIFICATE_SKIP_FETCH` if photo fetching should be skipped at build time      | Pages → Settings → Builds → Environment variables (Production and Preview)                                               |
| Local Wrangler development                                          | `.dev.vars` (gitignored) with **test** credentials; copy `.dev.vars.example`                                                                                                       | Never commit it                                                                                                          |
| Authorized reviews-refresh job (CI or a laptop)                     | `REVIEWS_EXPORT_URL`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`                                                                                                             | Wherever `npm run pull-reviews` runs                                                                                     |
| Media upload laptop                                                 | `CF_ACCOUNT_ID`, `CF_API_TOKEN` (Images + Stream write scopes) for `npm run upload-media`; `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID` for `npm run pull-airtable`                        | Shell environment for that command                                                                                       |

`CF_ACCOUNT_ID`/`CF_API_TOKEN` (media scripts) and `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` (deploy workflow) are intentionally different names for different tokens with different scopes. The storefront runtime never receives a deployment token.

## Functions secrets (Cloudflare Pages runtime)

| Variable                                       | Consumer                                       | Sensitivity | Preview vs production                                        | Verify                                                                         |
| ---------------------------------------------- | ---------------------------------------------- | ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`                            | `functions/_lib/stripe.ts` (checkout, webhook) | secret      | test key on Preview, live key on Production                  | `GET /api/health` → `stripe:true`; a test checkout reaches Stripe              |
| `STRIPE_WEBHOOK_SECRET`                        | `functions/api/stripe-webhook.ts`              | secret      | one per webhook **endpoint** (Preview and Production differ) | `stripe trigger checkout.session.expired` → 200 in Stripe's webhook log        |
| `TURNSTILE_SECRET`                             | `functions/_lib/turnstile.ts`                  | secret      | test key `1x0000…AA` on Preview                              | a form submission with the widget passes                                       |
| `ADMIN_EMAIL`                                  | `functions/_lib/email.ts`                      | private     | same                                                         | admin notification arrives                                                     |
| `ADMIN_EMAIL_FROM`                             | `functions/_lib/email.ts`                      | private     | must be a sender the provider has **verified**               | provider dashboard shows the sender verified; test email delivered             |
| `ADMIN_EMAIL_API_KEY`                          | `functions/_lib/email.ts`                      | secret      | same key is fine                                             | as above                                                                       |
| `EMAIL_API_KEY`, `EMAIL_LIST_ID`               | `functions/_lib/email.ts` (Kit/Klaviyo sync)   | secret / id | use a test list on Preview                                   | a waitlist signup appears in the provider with tags                            |
| `META_PIXEL_ID`, `META_CAPI_TOKEN`             | `functions/_lib/capi.ts`                       | id / secret | leave unset on Preview                                       | Meta Test Events shows the server event once                                   |
| `DEPLOY_HOOK_URL`                              | `functions/_lib/deploy.ts`                     | secret      | Production only                                              | approving a review triggers a build                                            |
| `ADMIN_ACCESS_AUD`, `ADMIN_ACCESS_TEAM_DOMAIN` | `functions/_lib/access.ts`                     | private     | both environments once Access exists                         | incognito `/admin` prompts for login; `/api/admin/inventory` is 401 without it |
| `TRADE_PROMO_CODE`                             | `functions/api/stripe-webhook.ts`              | private     | same                                                         | a trade order row has `is_trade = 1`                                           |
| `REVIEW_TOKEN_SECRET`                          | `functions/_lib/tokens.ts`                     | secret      | different per environment                                    | a generated review link validates                                              |
| `JEV_API_KEY`                                  | `functions/_lib/jev.ts` (advisory only)        | secret      | optional; unset = feature off                                | `GET /api/health` → `jev:true` (configured, not proven working)                |
| `JEV_MODEL`, `JEV_DISABLED`                    | `functions/_lib/jev.ts`                        | config      | optional                                                     | see `docs/JEV.md`                                                              |

## `[vars]` in `wrangler.toml` (public configuration, applied on deploy)

`PUBLIC_SITE_URL`, `PUBLIC_BRAND_NAME`, `PUBLIC_DEALER_NAME`, `PUBLIC_PHONE`, `PUBLIC_WHATSAPP`, `PUBLIC_EMAIL`, `PUBLIC_ADDRESS`, `PUBLIC_LOCAL_AREA`, `PUBLIC_BOOKING_URL`, social URLs, `PUBLIC_GOOGLE_REVIEW_URL`, `LAUNCH_MODE`, `SOLD_INDEX_DAYS`, `EMAIL_PROVIDER`, `ADMIN_EMAIL_PROVIDER`, `RATE_LIMIT_PER_MINUTE`. `CF_IMAGES_HASH` is read by Functions too and belongs here once Images is set up.

## Build-time only (Astro reads `import.meta.env`; Functions never see these)

| Variable                                                                                                   | Consumer                            | Notes                                                                 |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `PUBLIC_GA4_ID` (alias `GA4_ID`), `PUBLIC_META_PIXEL_ID` (alias `META_PIXEL_ID`), `PUBLIC_CF_BEACON_TOKEN` | `src/lib/site.ts`, analytics island | public identifiers; marketing tags load only per the consent flow     |
| `PUBLIC_BNPL_ENABLED`, `PUBLIC_CONSENT_BANNER`                                                             | `src/lib/site.ts`, layout           | strings compared with `=== 'true'`; anything else is false            |
| `PUBLIC_HERO_STREAM_ID`, `PUBLIC_FOUNDER_STREAM_ID`                                                        | `Hero.astro`, `MeetChris.astro`     | Cloudflare Stream ids                                                 |
| `PUBLIC_TURNSTILE_SITEKEY`                                                                                 | forms                               | public                                                                |
| `CERTIFICATE_SKIP_FETCH`                                                                                   | `scripts/certificate.mjs`           | `true` skips photo fetches (CI); PDFs then show the placeholder block |

## Bindings and migrations

1. Create once: `wrangler d1 create rug-store`, `wrangler kv namespace create RUG_STATUS`, `wrangler r2 bucket create rug-store-uploads`; paste the D1 `database_id` and KV `id` into `wrangler.toml` (both are placeholders today). Preview deployments share these unless you create `--preview` namespaces and add `[env.preview]` bindings; do that before Preview handles real form traffic.
2. Migrations are additive and numbered: `migrations/0001_init.sql`, `migrations/0002_jev.sql`. Apply **before** deploying code that references new columns: `npm run db:migrate:remote` (and `:local` for Wrangler dev).
3. Rollback: a code revert does not drop columns. `0002` adds nullable columns only, so old code keeps working against the new schema; leave the columns in place.
4. Back up before a remote migration: `wrangler d1 export DB --remote --output backup-<date>.sql`.

## Status at hand-off (Sep 29, 2026)

No production value is set anywhere yet. D1/KV/R2 are not created (Cloudflare connector failed in the build session; the CLI is unauthenticated). The matrix above is the checklist for whoever holds the accounts.
