# Email program

**Status: not active.** No provider account is connected, no sequence exists in Kit, and nothing in this repo sends marketing email. This document describes how the pieces fit once Chris connects Kit (the provider `wrangler.toml` sets as `EMAIL_PROVIDER = "kit"`).

## What the site does today

`functions/_lib/email.ts` → `syncSubscriber()` is called by the waitlist form and, after a purchase with `consent.promotions = opt_in`, by the Stripe webhook. It upserts the subscriber in Kit (or Klaviyo if `EMAIL_PROVIDER` is switched) with:

| Tag              | Written when                                                 |
| ---------------- | ------------------------------------------------------------ |
| `waitlist`       | drop-list / waitlist signup                                  |
| `size:<bucket>`  | signup form interest, e.g. `size:8x10`                       |
| `style:<style>`  | signup form interest, e.g. `style:oushak`                    |
| `customer`       | checkout completed with marketing consent                    |
| `bought:<rugId>` | one per rug in the order                                     |
| `lead:rug-check` | planned: 5-Minute Rug Check download (form not built)        |
| `trade`          | planned: "I'm a designer or stager" box on the download form |

`source` is recorded as `waitlist` or `checkout`. Secrets needed at runtime: `EMAIL_API_KEY`, `EMAIL_LIST_ID` (a Kit form id). Verify the endpoint paths in `email.ts` against Kit's current API before launch; they were written from documentation, not a live account.

## Consent, suppression and re-entry (set these in Kit, not in code)

- **Double opt-in on.** The welcome series must start only after the confirmation click. The site never confirms on the subscriber's behalf.
- **Suppression:** unsubscribes and bounces are Kit's source of truth. The site keeps a `consent` column in D1 `waitlist` and `marketing_consent` on `orders` for audit, but never re-adds a suppressed address; `syncSubscriber` upserts by email, which Kit treats as a no-op for unsubscribed contacts.
- **Re-entry:** a `customer` tag should remove the contact from the welcome series (Kit rule: "tag added `customer` → exit sequence"). A returning customer who buys again gets a new `bought:` tag, not a second welcome.
- **CAN-SPAM:** every template carries `{{ unsubscribe_link }}` and `{{ postal_address }}`; the address must be a real business mailing address, set in Kit's account settings.
- **Privacy page:** `/privacy` now describes the provider neutrally. If Kit is the final choice, name it there.

## Sequence: welcome (3 emails)

Files: `content/emails/welcome-1.md`, `welcome-2.md`, `welcome-3.md`. Each file states trigger, delay, subject, preview text, body and its copy-guard result.

| #   | Trigger                  | Subject                                      |
| --- | ------------------------ | -------------------------------------------- |
| 1   | confirmation (immediate) | You're on the list. Here is how this works.  |
| 2   | +3 days                  | The ten-second flip test                     |
| 3   | +4 days after #2         | The rug that looks big enough online (isn't) |

Exit rules: `customer` tag, or unsubscribe. Drop announcements are broadcasts, not part of the sequence, and go only when rugs are actually live.

## Sequence: 5-Minute Rug Check nurture (7 emails, not active)

File: `content/emails/nurture-5-minute-rug-check.md`. Trigger: tag `lead:rug-check` added by the lead-magnet form (page and PDF not built; see `content/lead-magnet-5-minute-rug-check.md`). Cadence: days 0, 3, 6, 10, 14, 18, 22, then the weekly drop broadcast. Designer branch: tag `trade` swaps emails 4 to 7 for the trade versions.

Rules to set in Kit:

- **One sequence at a time.** A contact already in Welcome does not enter Nurture until Welcome finishes, and a contact in Nurture does not enter Welcome; a later `waitlist` tag adds them to the drop broadcast only.
- **Exit on purchase.** `customer` tag exits both sequences.
- **Blocked emails.** Emails 1 (PDF link), 3 (needs a real rug) and 4 (Chris's true story) carry `[VERIFY]` blockers in the file and are not loaded until resolved. Loading the sequence with those three missing is fine as a draft, but it must stay paused.
- No rental or staging-program language anywhere until `docs/DECISIONS.md` settles the stager pilot.

## Post-purchase (not written yet)

The review request uses `reviewToken()` from `functions/_lib/tokens.ts` (needs `REVIEW_TOKEN_SECRET`) to build `https://<site>/reviews?token=…#write`. Send it from Kit or the transactional provider once delivery is confirmed; nothing sends it today.

## Loading into Kit

1. Create the form (id → `EMAIL_LIST_ID`) with double opt-in.
2. Create tags listed above so rules can reference them.
3. Create the "Welcome" sequence with the three emails; set delays as in the table; add the exit rule on `customer`.
4. Send each email to yourself with Kit's preview; check the unsubscribe link and postal address render.
5. Only then set `EMAIL_API_KEY`/`EMAIL_LIST_ID` in Pages (see `docs/ENVIRONMENT.md`) and test a waitlist signup end to end.
