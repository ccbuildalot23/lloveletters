# Jev (TypeSafe AI) advisory integration

**What Jev is.** A hosted "System One" decision model from TypeSafe AI. Instead of prose it returns typed, calibrated answers to questions you define: `choice` (one of up to 255 labelled options, with per-option probabilities and a confidence), `score` (a position on a 2–10 level ordered scale, possibly fractional, with the distribution and a confidence), and `noul` (a yes/no as a probability from 0 to 1; it is a number, never a boolean). Official endpoint: `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer <key>` and a body `{ model, state, questions }`. Docs: <https://docs.typesafe.ai/api>. This repo calls only that endpoint; it does not send keys to any gateway domain.

**What it does here.** Three advisory signals for the human who reads the admin inbox:

| Where                                   | Question set (`functions/_lib/jev.ts`) | Output                                                                                   |
| --------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Trade application (`/api/forms/trade`)  | `TRADE_QUESTIONS`                      | `lead_fit` score 1–5 and `route` approve / review / decline (insufficient info → review) |
| Contact form (`/api/forms/contact`)     | `CONTACT_QUESTIONS`                    | `route` sales / shipping / returns / trade / press / spam / other_or_unclear             |
| Review submission (`/api/forms/review`) | `REVIEW_QUESTIONS`                     | `looks_like_spam` and `publication_policy_signal`, both nouls                            |

The result is stored as JSON in the row's `jev` column (`migrations/0002_jev.sql`), appended to the admin notification as "Jev advisory (...)", and shown as a short line in `/admin/leads` and `/admin/reviews`. **Nothing branches on it.** No application is approved or declined, no message is dropped, no review is published or hidden by Jev. `publication_policy_signal` checks only for profanity, personal data, attacks on named people, and off-topic content; it says nothing about truth, consent, or whether the review is favourable, and a negative review is not spam.

## Safety rules the code enforces

- **Never throws, never blocks.** `decide()` returns `null` when the key is unset, `JEV_DISABLED=true`, the state was judged unsafe, the vendor times out (1,500 ms total, including reading the body), returns non-2xx, or returns an unexpected shape. The INSERT runs regardless, with `jev = NULL`. NULL means "no assessment", not a low score.
- **One call per accepted submission**, after honeypot, rate limit, Turnstile and Zod validation, so no paid inference runs for spam or invalid input. No retries.
- **Minimized state.** Only allowlisted fields go out (never name, email or phone), each capped at 1,200 characters, with emails, phone numbers, street addresses, SSN-like and card-like numbers redacted. If the text still mentions identity or financial documents, the call is skipped. User text is passed as data; the instructions tell the model to treat it that way.
- **Validated responses.** Question ids, type tags, enum membership, finite numbers, 0–1 ranges, distribution lengths and score ranges are all checked; anything else is discarded.
- **Sanitized logs.** One JSON line per call with `status` (ok, http_error, bad_json, bad_shape, timeout, network_error), latency, HTTP status and a correlation id. The state is never logged.
- **Stored JSON** contains the validated answers plus `model`, `rubric` (currently `v1`) and latency, never the state. It is excluded from the public reviews export (`scripts/pull-reviews.mjs` writes public fields only) and from the CSV export's meaning: it appears in `/admin/leads` CSV as a column for the owner, which is private.
- **Health.** `GET /api/health` reports `jev: true|false` meaning _configured_, not authenticated or working. A health check never runs inference.

## Configuration

| Variable       | Where                                              | Meaning                                                                                          |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `JEV_API_KEY`  | Pages runtime secret (`wrangler pages secret put`) | Enables the feature. Unset = off.                                                                |
| `JEV_MODEL`    | Pages runtime var (optional)                       | Defaults to `jev-latest`. Pin a version only after confirming it exists in the TypeSafe console. |
| `JEV_DISABLED` | Pages runtime var (optional)                       | `true` is the kill switch even when a key is present.                                            |

Vendor data terms: check <https://docs.typesafe.ai/legal> for retention before enabling on real submissions; do not assume zero retention unless the account has that agreement.

## Deploy order

1. `npm run db:migrate:remote` (adds the nullable `jev` columns). Old code keeps working.
2. Deploy the code.
3. Set `JEV_API_KEY` when you want assessments to start. Remove it, or set `JEV_DISABLED=true`, to stop.

## Catalog copy check

`npm run jev:catalog` (`scripts/jev-catalog-check.mjs`) asks three nouls per product: investment claim, implied silk, pressure tactic. It prints advisory warnings above `JEV_WARN_THRESHOLD` (0.5) and always exits 0. Without a key it prints "skipped" and runs no inference. The deterministic checks in `scripts/validate-catalog.mjs` remain the authoritative gate.

## Tests and what they prove

`tests/unit/jev.test.ts` covers: no key → no fetch; request shape against the official contract; a fractional score; noul 0 and 1; missing ids, bad enums, out-of-range values, wrong distribution lengths; malformed JSON; 401/429/500; stalled connection and stalled body timeouts with the timer cleared; sanitized logging; summary escaping; minimization. Passing mocked tests proves the parser and the failure paths, **not** live connectivity or decision quality.

**Live test (blocked until a key exists):** set `JEV_API_KEY` in `.dev.vars`, run `npm run build && npm run db:migrate:local && npm run preview`, POST a trade application through `/trade`, and confirm the D1 row has a `jev` JSON value and the admin email carries the advisory line.

## Rubric evaluation set (v1, human-labelled)

Small synthetic set to sanity-check calibration once a key exists. Expected labels are a person's judgement; disagreements are logged here, not treated as parser bugs.

| Case | State (minimized)                                                                                  | Expected                                        |
| ---- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| T1   | firm "Staged Interior", website real staging site, project_types [staging], resale_cert_given true | lead_fit 4–5, approve                           |
| T2   | firm "my house", website "instagram.com/personal", project_types []                                | lead_fit 1–2, decline or review                 |
| T3   | firm "Studio X", website "coming soon", project_types [residential]                                | lead_fit 2–3, review                            |
| C1   | message "Is TR-0003 still available and would it work in a 12×14 room?"                            | sales                                           |
| C2   | message "My rug arrived with a torn corner, order from last week"                                  | shipping                                        |
| C3   | message "We can rank your site #1, reply for a free audit"                                         | spam                                            |
| C4   | message "Hi" (nothing else)                                                                        | other_or_unclear                                |
| R1   | text "Beautiful rug, colours are exactly as filmed, arrived in 6 days"                             | spam ≤ 0.2, policy ≤ 0.2                        |
| R2   | text "Terrible experience, the fringe was worn more than shown" rating 2                           | spam ≤ 0.3 (negative is not spam), policy ≤ 0.2 |
| R3   | text "Great rugs!!! visit my-site.example for deals"                                               | spam ≥ 0.7                                      |
| R4   | text "Chris lied to me, call him at [phone]"                                                       | policy ≥ 0.6                                    |

Disagreements observed: none yet (no live run).
