# Provenant Rugs — corrected four-hour execution brief

Prepared September 28, 2026 (America/New_York). This is a revised instruction packet, not a report of completed implementation. Repository state, account access, catalog facts, and connector availability below come from the supplied handoff and must be checked by the executing agent.

## Objective and operating boundaries

Act as the engineering and launch-operations lead for Provenant Rugs. Use the next four active working hours to produce a reviewable draft PR, fix launch-critical defects, implement an advisory Jev integration, and deliver usable first versions of the content, outreach, and decision packages.

The reported work branch is `claude/vigilant-brahmagupta-5r3s15`, with reported baseline commit `cdaeaf8`. Resolve its full SHA and verify the repository owner/name before mutations. Do not treat a previous green build as evidence that the final commit passes.

Keep all four selected business workstreams in scope: ops, launch content, outreach drafts, and a decision memo. Distinguish the four-hour deliverables from the remaining full package. Do not label the complete original scope finished if only its first tranche is ready.

Authorized for this execution: repository edits, logical commits and pushes, creating a missing `main` at the verified baseline, one draft PR, the requested Airtable updates and Canva copies, and Gmail drafts to verified prospects. Never send outreach, publish social posts, activate marketing sequences, merge the PR, change production DNS, or deploy production as part of this sprint. Preparing a deployment workflow is in scope. Do not overwrite existing branches, user changes, templates, or records.

Read applicable repository instructions and inspect available tools. Load `anthropic-skills:caldwell-copy-guard` and `anthropic-skills:ai-counsel` if available. If missing, search the available skill catalog once; disclose their absence and use the explicit review rules below. Never claim a named skill or external model was run when it was not. Tool names in the old handoff are hints, not guaranteed capabilities.

## Four-hour budget and completion policy

The original package estimates total 255 minutes before tests, debugging, or setup. Use this revised budget and protect the final verification window.

| Window      | Work                              | Target output                                                                   |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------- |
| 0–15 min    | Preflight, evidence, Git baseline | Verified repository/branch, capability matrix, prioritized defects              |
| 15–85 min   | Ops and purchase-path hardening   | Focused fixes, deploy preparation, offline payment checks                       |
| 85–140 min  | Jev                               | Adapter, migrations, form integration, admin output, focused tests              |
| 140–175 min | Content and outreach              | Seven days of finished platform copy; first verified draft batch; full backlog  |
| 175–195 min | Decision brief and Plaud intake   | Two decision briefs, panel prompts, source-linked recording notes if accessible |
| 195–240 min | Final verification and handoff    | Final-SHA results, pushed draft PR, blockers and next actions                   |

These are planning budgets, not guaranteed durations. When critical defects consume a window, reduce content quantity and log the exact remainder. Do not compress payment, data-integrity, or final verification gates. At minute 195, stop new features, resolve blocking regressions, and finish the handoff. Run independent automated checks concurrently where practical; avoid editing shared build outputs during tests.

## A. Preflight and Git

1. Inspect repository instructions, working tree, remotes, default branch, existing branches/PRs, package scripts, lockfile, deployment configuration, current catalog, and any existing capability documentation. Preserve unrelated changes.
2. Recheck each reported blocker once using the relevant tool/auth mechanism. Report `available`, `missing credentials`, `insufficient permissions`, `tool unavailable`, or `unverified`, with a timestamp and redacted evidence. A missing connector does not prove the CLI/API is unusable, and a missing local environment variable does not prove the deployed service has no secret.
3. Check Stripe, Cloudflare, Jev, GitHub, Airtable, Canva, Gmail, Plaud, and OpenSEO separately. An HTTP 410 connector failure is a connector issue; adding an API token is not evidence it will fix that connector.
4. Resolve `cdaeaf8` to a full commit. If `main` is absent, create it at that verified baseline without resetting the work branch. If `main` exists, preserve it and inspect the actual comparison. Do not force-push.
5. Understand the review consequence: a new `main` at `cdaeaf8` makes the existing storefront the accepted baseline. The PR will review subsequent work only. Document the baseline SHA and link its checks so the original storefront is not represented as newly reviewed.
6. Commit coherent changes. After the first nonempty push, create or reuse one **draft** PR against `main`. Include scope, evidence, migrations, blocked live checks, and remaining work. Subscribe only if a supported capability exists; otherwise report that limitation.
7. Changing the GitHub default branch is technically possible through the repository API with sufficient access. Because the original handoff reserves that change for Chris, keep it as an owner action unless separately authorized. Check Cloudflare's production branch independently; changing GitHub's default does not establish the correct deployment configuration.

## B. Ops and launch-critical corrections

### Headers and visible content

- Inspect the effective CSP before adding `https://images.unsplash.com` to `img-src`. Preserve the existing policy and allow only required origins. Verify real response headers on static and Function-served routes: Pages `_headers` rules do not cover Function-generated responses. Add corresponding Function middleware headers where needed.
- Remove `[EMAIL PROVIDER]` using the actual configured email provider. Do not substitute “Kit or Klaviyo” into published privacy copy unless that accurately describes current processing. A provider-neutral description may be appropriate if accurate; record any unresolved disclosure decision.
- Check that checkout, trade, contact, review, consent, and admin flows still function with the final headers.

### Catalog evidence and PDFs

- Reconcile catalog IDs, product facts, actual inventory, and image rights. Unsplash room imagery may illustrate a setting; it must not be presented as a photograph or proof of the specific rug being sold.
- Generate product PDFs from verified catalog data. If authenticity/provenance is unsubstantiated, use a clearly described product record or keep the document unpublished. A generated PDF or signature line does not authenticate a rug. Never invent maker, age, origin, fiber, appraisal, or certification claims.
- Inspect `scripts/certificate.mjs`; accept approved image URLs and existing Cloudflare image IDs through explicit allowlists. Limit fetch time/size, validate content type, and handle redirects safely. Prefer versioned local or cached approved assets to mandatory internet fetches on every build.
- Generate PDFs after catalog validation and **before** Astro copies `public/` into `dist/`. Keep generated PDFs gitignored if regeneration is reliable. Remove stale generated PDFs safely within the generator-owned directory.
- Validate one expected artifact per eligible product and all product-to-PDF links. Check `dist/certificates/`, not just `public/certificates/`. Confirm PDF content, product ID, and image match. Eight PDFs is an expectation from the handoff, not a hardcoded truth.
- If verified inputs are unavailable, remove misleading/broken public links and report the blocked products. Do not substitute sample evidence to make the build pass.

### Reviews export

- Implement or inspect the actual `/api/admin/reviews-export` endpoint before adding its consumer. Protect it with the intended Access/application authorization and test unauthenticated denial in the relevant environment.
- `scripts/pull-reviews.mjs` uses `REVIEWS_EXPORT_URL`, `CF_ACCESS_CLIENT_ID`, and `CF_ACCESS_CLIENT_SECRET`. Use the documented `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers. Restrict the destination to the configured trusted HTTPS origin; do not forward credentials through arbitrary redirects.
- Export only approved, consented public review fields. Exclude emails, IPs, tokens, moderation notes, Jev assessments, and other private fields from `src/data/reviews.json` and public build artifacts.
- Missing configuration: explicit skipped status and preserve the existing snapshot. Configured fetch failure, invalid payload, or login HTML: visible failure, no overwrite. Validate the schema and write atomically; distinguish a legitimate empty export from a failed export.
- Define how approved changes reach the static site: authenticated manual refresh now, or a documented scheduled rebuild later. Document freshness and the refresh command; fix the misleading comment in `src/lib/reviews.ts` and README reference.

### Environment ownership

Create `docs/ENVIRONMENT.md` with the variable, consumer, sensitivity, location, preview/production distinction, and verification method. Do not print secret values. Use one canonical name per purpose and document any necessary alias.

| Destination                                                     | Configuration                                                                                                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorized CLI/CI deployment environment                        | `CLOUDFLARE_API_TOKEN` secret; `CLOUDFLARE_ACCOUNT_ID` configuration identifier; confirmed project name                                                                                      |
| Cloudflare Pages runtime, separately for preview and production | `STRIPE_SECRET_KEY`, endpoint-specific `STRIPE_WEBHOOK_SECRET`, `REVIEW_TOKEN_SECRET`, optional `JEV_API_KEY`, actual email/Airtable credentials and any other secrets consumed by Functions |
| Astro build environment                                         | Applicable `PUBLIC_*` IDs and feature flags; these are intentionally public and never hold secrets                                                                                           |
| Local Wrangler development                                      | Ignored `.dev.vars` or the repo's documented alternative with test credentials                                                                                                               |
| Authorized reviews-refresh job                                  | Reviews export URL and Cloudflare Access service credentials                                                                                                                                 |

Adding secrets to an agent session does not install them into GitHub Actions or Cloudflare runtime. Account IDs are not secret keys. Provisioned D1/KV/R2 resources and bindings are a separate requirement.

Audit all names from the prior plan: `ADMIN_EMAIL_FROM`, `TRADE_PROMO_CODE`, `REVIEW_TOKEN_SECRET`, `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_CF_BEACON_TOKEN`, `PUBLIC_BNPL_ENABLED`, `PUBLIC_CONSENT_BANNER`, `PUBLIC_HERO_STREAM_ID`, `PUBLIC_FOUNDER_STREAM_ID`, `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `AIRTABLE_TABLE`, `JEV_API_KEY`, and review-export settings. Add only supported variables to the correct examples. Resolve `CF_*` versus `CLOUDFLARE_*` based on actual consumers; do not silently rename or give the storefront a deployment token unnecessarily. Parse boolean strings explicitly. Verify `ADMIN_EMAIL_FROM` matches a usable verified sender. Keep analytics and marketing behavior consistent with the actual consent flow.

### Stripe and inventory correctness

- Separate credential presence, authentication, and working checkout. Without keys, keep live integration checks blocked but run mocked contract/unit tests, including webhook signatures with a synthetic test secret.
- Audit server-side price/SKU validation; never trust client-supplied totals. Test duplicate webhook delivery, invalid signatures, event reordering, canceled/expired checkout, and safe retries.
- For one-of-one inventory, check how simultaneous buyers are prevented from purchasing the same rug, when inventory is reserved/released, and how sold-out state reaches the storefront. A webhook dedupe check alone does not solve competing checkout sessions.
- Record shipping, tax, returns, fulfillment notification, and refund requirements that still need real operational confirmation. Do not perform live charges.

### CI, migrations, and deploy preparation

- Verify Playwright project definitions in its config as well as invocation in `.github/workflows/ci.yml`; add `pixel-8` and `ipad` only if absent. Ensure required browser binaries are installed.
- Use lockfile-based installation and the supported Node version. Protect deployment behind successful checks on the **same commit**. A separate workflow that deploys on every `main` push can race CI; use job dependencies or an equivalent verified gating design.
- Inspect existing Cloudflare Git integration before adding GitHub Actions deployment. Choose one production deployment owner and prevent duplicate deployments.
- Prepare `.github/workflows/deploy.yml` for the confirmed project, using the supported Wrangler action, minimal permissions, appropriate concurrency, and the correct production branch. Validate Functions packaging as well as static assets.
- Inventory D1/KV/R2 requirements; document resource creation, bindings, preview isolation, and exact migration targets. Apply additive migrations before code that references new columns. Record backup/recovery steps before remote migration; a code rollback does not roll back database schema.
- Keep production deployment inactive during this draft-PR sprint. Missing credentials must produce an explicit blocked status, not a success-shaped no-op.
- Keep LCP ≤ 2,000 ms and CLS ≤ 0.05 as targets. Use representative production-build pages and consistent Lighthouse settings over repeated runs. Tighten enforced thresholds only with evidence; otherwise document the gap without weakening current checks or claiming compliance.

## C. Jev advisory integration

Use TypeSafe's official documentation and `POST https://api.typesafe.ai/v1/systemone`. Remove the unverified `jevtypesafeai.com` gateway. Do not send keys to alternative domains. For this sprint, prefer a fixed official endpoint and injected fetch for tests over a general URL override.

Implement `functions/_lib/jev.ts`, corresponding environment types, and pure `buildJevRequest`, `parseJevResponse`, and `jevSummary` functions. Keep `JEV_MODEL` configurable; log/store the returned model and a rubric version. Verify the selected model exists before pinning it.

The request contains `state`, `model`, and a named `questions` map. Choice uses an option-description map. Score uses ordered level descriptions and may return fractional scores. Noul returns a number from 0 to 1, not a boolean; never use its raw value as a truthiness test. Validate returned question IDs, type tags, enum membership, finite numeric values, distributions, and range/legend consistency against the official contract.

Suggested question sets:

- Trade: five-level `lead_fit` rubric based on explicit business requirements; advisory `route` of approve/review/decline, with insufficient information directed to review.
- Contact: sales/shipping/returns/trade/press/spam plus `other_or_unclear`. Provide a clear rule for multi-topic messages.
- Reviews: `looks_like_spam` and a narrowly defined publication-policy signal. If retaining `safe_to_publish`, define the exact limited checks and label it advisory. It does not establish consent, truth, or permission to publish. Critical or negative reviews are not inherently spam.

Construct state from allowlisted fields. Removing dedicated email/phone fields is insufficient because free text can contain names, addresses, order details, or other sensitive material. Use minimization, bounded input, and appropriate redaction; skip sensitive submissions when safe minimization is uncertain. Treat user text as data, not instructions. Document applicable vendor data terms and do not assume the account has enterprise zero retention.

Run normal validation, abuse controls, and size limits before any paid inference. One request per accepted submission. Use a total 1,500 ms advisory deadline covering response consumption, abort correctly, clear timers, and avoid inline retry multiplication. SDK retries must fit or be disabled for this path. Unset key, timeout, network failure, non-2xx, or invalid shape returns `null`; expected missing configuration is not an error storm. Logs contain only safe status codes, latency, and correlation metadata.

For minimal change, a bounded advisory call before INSERT is acceptable if measured against the form latency budget. No provider failure may prevent saving a valid submission. If existing architecture supports durable asynchronous enrichment, reuse it; do not build a new queue just for this sprint or rely on an unawaited promise. Core persistence failures must still be reported honestly.

- Add the next unused migration number, using `0002_jev.sql` only if free: nullable `jev TEXT` columns on trade applications, contacts, and reviews.
- Store only validated advisory results plus model/rubric metadata. Keep raw submitted state out of this JSON. SQL NULL means no assessment, not a low score. Treat successful persistence as authoritative even if a later notification fails; retries must not duplicate the submission.
- Update affected INSERT/SELECT paths and admin rendering. Escape summaries; keep Jev metadata out of public reviews and other public exports.
- Include the summary in existing admin notifications where available, with “advisory” labeling and no automatic approval, rejection, suppression, publication, or customer response.
- Add a backward-compatible `jev` configuration boolean if required by the current health API; document that it means configured, not authenticated or operational. Keep detailed diagnostics authenticated. A health request must not trigger paid inference.
- Add `scripts/jev-catalog-check.mjs` and `jev:catalog`: atomic checks for prohibited investment claims, implied silk, and pressure tactics. Keep Jev warn-only. Existing deterministic copy checks remain authoritative and run without a key. Explicitly report skipped inference.

Test unset key with no fetch; official request/response fixtures; fractional Score; Noul 0 and 1; missing IDs; bad enums; out-of-range values; malformed JSON; 401/429/5xx; timeout including a stalled body; sanitized logging; summary escaping; and a successful form INSERT with Jev disabled or unavailable. Add a small synthetic, human-labeled rubric evaluation set and document disagreements separately from parser correctness.

Deliver `docs/JEV.md`, README references, migration/deploy ordering, a kill switch, and exact blocked live-test steps. Passing mocked tests is not proof of live API connectivity or decision quality.

## D. Launch content and SEO

Four-hour target: a 30-day topic map, fully drafted first seven days for Instagram and Pinterest (14 platform entries), bios, the three welcome emails, and six Canva-ready creative briefs. Complete all 60 finished entries and six rendered Canva assets only after critical engineering is verified; list unfinished quantities precisely.

Use `content/calendar-30-day.md` with four pillars: one rug/one story, construction evidence, DC rooms, care/sizing. Treat the flip test as supporting construction evidence, not conclusive proof of age, origin, or fiber. Adapt Instagram and Pinterest copy to each platform.

Each finished entry includes a stable content ID, relative day, platform, pillar, source/product ID, hook, caption, CTA, format, asset note, destination URL, tracking parameters where appropriate, and status. Day 1 starts on the actual launch date; do not assign misleading dates before launch is ready. Add Pinterest title/description and descriptive alt text. Draft copy may not claim unavailable delivery, live inventory, partnerships, or customer experiences.

Verify Airtable base `appyY3lhhzj1JbfT0` and the existing schema. Reuse or create **Content Calendar** as appropriate; upsert by stable content ID and platform. Include Day, Platform, Pillar, Hook, Caption, CTA, Asset, Status, source, and destination fields. Match existing field types rather than blindly creating incompatible ones. If blocked, provide an importable CSV and mapping; never claim a sync occurred.

Verify Canva template `DAHWh5sFheQ` and `docs/COLOR.md`. Copy the template, preserve the original, use verified rug imagery, inspect rendering/legibility, and attach real design/export links to matching entries. If unavailable, deliver exact layouts and copy with `Design pending` status; do not invent links.

Create `content/bios.md` for Instagram, Pinterest, TikTok, YouTube, and Google Business. Verify handles and any location/service-area claims; do not assume business-profile eligibility or a public showroom. Create `content/emails/welcome-{1,2,3}.md` with subjects, preview text, body, CTA, and delays. `docs/EMAIL.md` must match the actual provider and site tag IDs, trigger, consent, unsubscribe/suppression behavior, and re-entry rules. Do not call an unconfigured sequence active.

Apply the named copy-guard if available, plus a factual review across site text, PDF text, metadata, JSON-LD, captions, graphics, emails, bios, and outreach. No fabricated numbers, testimonials, rug histories, investment language, silk implications, or urgency. Use the exact approved brand spelling. A word-list pass does not establish truth.

Keep the two 1,500+ word guides in the full-scope backlog unless sufficient time remains: `oushak-rugs-explained.astro` and `what-size-rug-do-i-need.astro`. Inspect the referenced spec and JSON-LD helper. Include sourced rug facts, practical room-by-room sizing, internal links, canonical metadata, and accurate Article markup. No padding solely to meet a word count. Check the generated sitemap and links rather than assuming automatic inclusion.

For `docs/SEO.md`, use OpenSEO only if available and verify credit cost before calls; keep total usage below 2,000 credits. Map Turkish rug, Oushak rug, vintage Turkish rug, hand-knotted rug DC, kilim, and rug size guide to distinct relevant pages. Record source/date/market for metrics. Without the service, deliver a provisional intent map with metrics marked unavailable. Do not invent search volume or target inventory categories the shop does not sell.

## E. Outreach drafts

Inspect **DC Prospects**, its source document, current row status, and existing Gmail drafts before writing. Priority A is the selection rule; the listed businesses are candidates, not verified recipients: Staged Interior, wowed!, Staged Beautiful, Alder & Ash, Scène, Storie Collective, Paul Corrie, Darlene Molnar, Georgia & Hunt, Ella Scott, and Ally Banks.

Verify business identity, public business email, relevance, and whether prior outreach or an opt-out exists. Use source-backed “why they fit” details. Do not guess named recipients or email formats. Keep private contact information out of the Git repository and PR.

Create **Gmail drafts only**. Start with 3–5 verified high-priority prospects within the four-hour budget; finish the remaining eligible rows if time remains. Use the existing interview-request template, one concise personalization detail, a clear learning purpose, and one low-friction ask. Do not imply an agreed partnership or settled rental terms.

Make creation rerunnable: track a stable prospect/campaign key, check existing drafts, and store the returned draft ID in Airtable. After confirmed creation, append `Draft created <actual date>`, set Channel = Email, and preserve Contacted unchecked and any existing notes. If Airtable writeback fails, record the draft ID privately so a retry does not duplicate it. Verify only task-created drafts; avoid account-wide claims about mail sent by others.

For form-only prospects, create unsent DM/contact-form variants in `docs/OUTREACH.md` without exposing private CRM data. The proposed 5–8 daily messages is a later manual workload ceiling, not a platform-approved safety limit. Recommend a smaller initial batch, inspect replies, and allow one relevant follow-up after roughly 5–7 business days; stop on decline or opt-out. Nothing is sent or scheduled in this sprint.

## F. Decision brief and Plaud

Create `docs/DECISIONS.md` with known facts, assumptions, missing evidence, options, tradeoffs, provisional recommendations, and a next decision owner. AI panel output is research input, not legal counsel or an insurance determination.

Trademark question: whether to retain Provenant Rugs after clearance, and then what filing scope/basis fits actual use and plans. Treat alleged PROVENANCE crowding as an unverified lead until documented. Include similar marks, related goods/services, common-law use, and potential confusion; Class 27/35 labels alone do not establish clearance. Separate intent-to-use from use-in-commerce analysis and include a rename option if needed. Provisional recommendation: obtain a focused clearance assessment before committing more to the name; do not file or claim clearance on an AI vote.

Stager question: distinguish paid rental, consignment, and referral arrangements. Define term, extensions, delivery/pickup, cleaning, storage, damage/theft, deposits, sale availability, purchase-credit treatment, commission basis, payout trigger, and responsibility for insurance/deductibles. Obtain coverage confirmation from the relevant insurer/broker before placing rugs. A contract allocating liability is not proof of coverage.

Model pilot economics transparently: retained term fees plus realized sales margin after refunds, commissions, and credits, minus delivery/pickup, cleaning, storage, attributable insurance, expected damage/loss, handling labor, and inventory carrying/opportunity costs. Do not double-count rental credits. Show labeled low/base/high assumptions and break-even values; leave unknown inputs blank or clearly hypothetical. Provisional recommendation: test a small, bounded pilot only when contribution and coverage requirements are explicit.

Produce separate prompts for ChatGPT, Gemini, Perplexity, and DeepSeek covering commercial economics, counterarguments, source verification, and independent critique. Do not claim a panel was convened unless the models were actually queried. Phase 2 begins when their answers exist. For Jev, prepare narrow evidence-triage questions with an `insufficient_evidence` option; do not ask it to select a trademark filing strategy or insurance arrangement as a substitute for the analysis. Validate any JSON examples against the current official schema.

Check Plaud availability once. If accessible, use only relevant Provenant marketing/sales/sourcing recordings and create source-linked notes with recording ID/title, date, timestamp, exact statement or marked paraphrase, confidence, and proposed use. Distinguish brainstorming from commitments. Do not publish private third-party remarks or reinterpret personal recordings as brand copy. Keep raw recordings/transcripts and personal details out of Git.

If unavailable, document the observed connector route and offer transcript/audio export as an alternative. Do not assert a particular settings URL or mandatory new session without checking the current environment. Do not claim recordings were mined when none were accessed.

## G. Verification and evidence-based handoff

Run commands supported by the actual repository. Preserve existing gates and record results against the final pushed SHA:

```text
npx prettier --check .
npx eslint .
npx astro check
npx tsc --noEmit -p functions/tsconfig.json
npm test
npm run build
node scripts/check-budgets.mjs
npx playwright test --project=desktop-chrome --project=a11y --project=iphone-15 --project=pixel-8 --project=ipad
npm run lhci
```

Use local Wrangler for Functions tests, not merely a static Astro server. Apply the migration to an isolated local database; test both a fresh schema and an upgrade fixture. Confirm health indicates Jev unconfigured, valid trade/contact/review submissions persist with SQL NULL Jev data, and provider failure does not lose submissions. Test real server validation with synthetic data. Keep database migration tests separate from external-provider tests.

Check catalog/JSON-LD consistency, PDF links in the final build, protected admin/export paths, review-export privacy, CSP behavior, and the affected checkout/inventory paths. Report each gate as passed, failed, blocked, skipped, or not run. Missing Stripe keys do not justify skipping offline payment tests; passing offline tests does not clear live checkout for launch. After final edits, rerun affected checks; never present earlier-SHA results as final-SHA evidence.

Update `docs/HANDOFF.md` with:

1. Branch, baseline SHA, final SHA, draft PR URL and status, and subscription result if supported.
2. Completed files/features and the exact test evidence, including failures and skips.
3. Configuration matrix with destination, owner, and verification action for every missing credential/binding.
4. Jev's advisory limits, tested no-op behavior, live-test status, model/rubric version, and disable path.
5. Deployment owner, migration order, rollback constraints, and production branch/default-branch owner actions.
6. Counts of finished content entries, designs, Airtable updates, and task-created Gmail drafts, with valid links/IDs kept in appropriate private systems.
7. Plaud access outcome, sources actually used, and remaining import steps.
8. All deferred original deliverables, prioritized and with concrete next actions.
9. Launch decision: `not ready`, `preview ready`, or `production ready`, supported by evidence. No production-ready claim while checkout, real catalog evidence, required bindings, or other critical gates remain unverified.

Continue through authorized work without repeatedly asking permission. When a capability is blocked, finish its local reviewable deliverable and proceed. Ask only for a missing fact or permission that genuinely prevents a necessary next step.

## Reference basis for this correction

Primary documentation reviewed for the plan; the repository itself was not inspected for this revision:

- [TypeSafe introduction and appropriate question scope](https://docs.typesafe.ai/introduction)
- [TypeSafe official API contract](https://docs.typesafe.ai/api)
- [TypeSafe legal documents and enterprise zero-retention notice](https://docs.typesafe.ai/legal)
- [Cloudflare Pages headers and Functions limitation](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Pages runtime bindings and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [GitHub repository API, including default_branch](https://docs.github.com/en/rest/repos/repos#update-a-repository)
- [Stripe webhook verification and delivery behavior](https://docs.stripe.com/webhooks)
- [USPTO clearance-search guidance](https://www.uspto.gov/trademarks/basics/why-search-similar-trademarks)
- [USPTO filing bases](https://www.uspto.gov/trademarks/apply/basis)
