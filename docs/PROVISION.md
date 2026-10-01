# Cloudflare provisioning runbook

One-time setup that turns the repo into a live Pages project with its D1, KV and R2 bindings and a first preview deploy. Written so a fresh session (or Chris on a laptop) can run it top to bottom. Every command is idempotent or safe to re-run; nothing here touches DNS or merges anything.

Prerequisites: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the shell environment (the token scopes are listed in `docs/ENVIRONMENT.md` and the handoff: Pages, D1, Workers KV Storage and Workers R2 Storage at Edit, Account Settings and User Details at Read). Wrangler reads both variables automatically. Secrets are read when a session starts, so a session opened before they were added cannot see them.

Network prerequisite for a cloud session: the environment's network policy must allow outbound HTTPS to `api.cloudflare.com` (every wrangler command) and `*.pages.dev` (the step 6 checks). On Sep 30 the default policy answered 403 to both; change Network access in the environment settings (cloud environment menu → Edit) before retrying. Set `WRANGLER_SEND_METRICS=false` so wrangler does not also try to reach its telemetry host. A laptop shell has no such restriction.

Pre-flight for a cloud session, before anything else:

```
test -n "$CLOUDFLARE_API_TOKEN" && test -n "$CLOUDFLARE_ACCOUNT_ID" && echo "vars: ok" || echo "vars: MISSING"
curl -s -o /dev/null -w "api.cloudflare.com -> %{http_code}\n" https://api.cloudflare.com/client/v4/
```

Both must pass (`vars: ok`, and any HTTP status other than `000`) or the runbook stops here.

## 0. Confirm the token

```
npx wrangler whoami
```

Expected: the account name, the account ID, and a scopes list that includes `pages (write)`, `d1 (write)`, `workers_kv (write)` and `workers_r2 (write)`. Stop here if any is missing; the token was built from the wrong template.

## 1. Create the resources

```
npx wrangler d1 create rug-store
npx wrangler kv namespace create RUG_STATUS
npx wrangler r2 bucket create rug-store-uploads
```

Each command prints an id. If a resource already exists the command fails with a clear message; list instead:

```
npx wrangler d1 list
npx wrangler kv namespace list
npx wrangler r2 bucket list
```

## 2. Paste the ids into `wrangler.toml`

- `[[d1_databases]].database_id` → the D1 id (replaces the all-zero placeholder).
- `[[kv_namespaces]].id` → the KV namespace id (replaces the `…dead` placeholder).
- R2 needs no id; the bucket name `rug-store-uploads` is already correct.

Commit that change on the work branch; the ids are identifiers, not secrets.

## 3. Apply the migrations to the remote database

```
npx wrangler d1 migrations list DB --remote
npm run db:migrate:remote
```

Expected: `0001_init.sql` and `0002_jev.sql` applied, in that order. Both are additive. Re-running is a no-op.

## 4. Create the Pages project

```
npx wrangler pages project create rug-store --production-branch main
```

If it already exists, `npx wrangler pages project list` shows it. Production branch stays `main`; the work branch deploys as a preview.

## 5. First preview deploy

```
CERTIFICATE_SKIP_FETCH=true npm run build
npx wrangler pages deploy ./dist --project-name rug-store --branch claude/vigilant-brahmagupta-5r3s15
```

`CERTIFICATE_SKIP_FETCH=true` is needed only where outbound image fetches are blocked (the build sandbox); on a laptop omit it so the sample certificates carry their photos. The deploy prints a preview URL of the form `https://<hash>.rug-store.pages.dev` plus a branch alias. Bindings from `wrangler.toml` are attached automatically because the file declares `pages_build_output_dir`.

## 6. Verify the preview

```
curl -s https://<preview-url>/api/health
```

Expected JSON: `stripe:false`, `jev:false`, D1 and KV reachable. Then open `/`, one product page, and `/certificates/TR-0001.pdf`. Check the response headers on `/` and `/api/health` for the CSP and the other security headers.

## 7. Runtime secrets (only the ones that exist yet)

```
npx wrangler pages secret put TURNSTILE_SECRET --project-name rug-store
```

Use the Turnstile test secret on Preview. Stripe, Kit, Resend, Jev and Meta secrets wait until their keys exist; the matrix is in `docs/ENVIRONMENT.md`. Nothing goes to Production until the launch decision flips.

## 8. Choose one production deployer

Either keep the gated `deploy.yml` (add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets; it deploys `main` after CI passes) **or** connect the repo in the Pages dashboard for Git-driven builds. Never both. Until `main` carries the reviewed code, neither produces a production site, which is the intended state.

## What this runbook never does

- No DNS or custom-domain changes; `provenantrugs.com` is attached in the dashboard by Chris when ready.
- No merge to `main`, no production deploy.
- No secret values written to the repo, the handoff, or chat.
