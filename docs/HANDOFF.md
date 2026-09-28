# Handoff notes for Chris

_Written while you were asleep (Sep 28–29, 2026). Everything below is either done, or a decision only you can make._

## Done since the Provenant Rugs rebrand

- **Photography:** the eight `SAMPLE` rugs now use real rug photography from Unsplash (hotlinked, credited on each product page, alt text says "sample"). The hero poster, founder stand-in, workshop and room images are Unsplash too. See `docs/SAMPLE_MEDIA.md`.
- **Brand system:** dye-derived palette with the reasoning in `docs/COLOR.md`; SVG knot-mark logo (`src/components/ui/Logo.astro`) in the header, footer, favicon and manifest; generated Open Graph image `public/og-default.png`.
- **Airtable** (workspace Harmoniq Solutions, base `appyY3lhhzj1JbfT0`): `Rugs` seeded with the 8 sample rugs, `DC Prospects` with all 30 prospects and the outreach tracker, `Launch Checklist` with 28 items. IDs are in the README.
- **Canva:** logo concept board (<https://canva.link/z139e3bu929drw1>) and an Instagram template (<https://canva.link/yh53h1nraw1kqkp>) for the "one rug, one story" posts.
- **Pricing bands** from the demand evidence live in `src/lib/pricing.ts`; the catalog validator warns when a price sits outside the band for its size and condition.
- **Stager channel:** `/trade#stagers` pilot section and FAQ, marked `[PILOT]` / `[EDIT]`.

## Questions I need you to answer

1. **Pull request.** The repo has no `main` branch, so the work branch (`claude/vigilant-brahmagupta-5r3s15`) became the default and there is nothing to open a PR against. Options: (a) let me create `main` from the current branch and open a draft PR for the next round of changes, or (b) keep committing to the work branch. I did not create `main` without asking.
2. **"jev".** Your message asked me to "use all connectors, jev, and canvas". I used Airtable, Canva, Unsplash and GitHub. I could not work out what "jev" refers to (a connector name? a person? a typo for "dev"?). Tell me and I will wire it in.
3. **Stripe test keys.** The reservation race test and the full checkout walkthrough need `STRIPE_SECRET_KEY` (test) and `STRIPE_WEBHOOK_SECRET` in `.dev.vars`. Everything else in the checkout path is verified locally with Wrangler; the Stripe-dependent tests are skipped until the keys exist.
4. **Cloudflare provisioning.** The Cloudflare connector failed to connect in this session, so D1, KV and R2 are not created yet. README §2 has the four `wrangler` commands; they take about two minutes once you are logged in.
5. **Domain and handle.** `provenantrugs.com` and `@provenantrugs` appeared available on Sep 28. Register both the same day you commit to the name (see `docs/BRAND.md` for the trademark screen caveats).
6. **Airtable workspace.** I put the base in Harmoniq Solutions because it was the only workspace available to the connector. Move it if Provenant Rugs should live somewhere else; nothing in the repo depends on the workspace.

## Before launch (short version)

The full checklist is in the README and in the Airtable `Launch Checklist` table. The three that block everything else: real photography and flip videos per rug, Stripe live keys plus Stripe Tax registration, and the legal pages reviewed.
