# Testing

## Automated

| Command                                                                | What it covers                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                             | Unit: contrast ratios for every text/background pair (3.1), product schema rules (7.1), JSON-LD shape (14.5), EXIF stripping.                                                                                                                                                                                                                                              |
| `npm run build && npm run budget`                                      | Build + gzip size budgets (12.3).                                                                                                                                                                                                                                                                                                                                          |
| `npm run test:e2e`                                                     | Playwright against `astro preview` (static pages): navigation, filters + URL state + back button, search (typo + ID jump), product page, gallery/lightbox keyboard, unit toggle, sold state, form validation UX, reflow at 320–1920 px, text-spacing override, keyboard-only walkthrough. Device projects: iPhone SE (375), iPhone 15 (393), Pixel (412), iPad (768/1024). |
| `npm run test:a11y`                                                    | axe-core (WCAG 2.2 AA + best practice) on every public route. Zero moderate/serious/critical violations allowed.                                                                                                                                                                                                                                                           |
| `E2E_BASE_URL=http://127.0.0.1:8788 npx playwright test --project=api` | Functions: live status, 409 on sold, **double-purchase race** (two parallel checkouts → exactly one 200, one 409), price tampering, waitlist de-dupe, honeypot, webhook signature, admin auth. Needs `wrangler pages dev ./dist` with `.dev.vars` (Stripe test keys) and `LAUNCH_MODE=live`.                                                                               |
| `npm run lhci`                                                         | Lighthouse CI on Home, Collection, Product (mobile). Asserts Performance ≥ 95, A11y/BP/SEO = 100, LCP ≤ 2.5 s, CLS ≤ 0.1.                                                                                                                                                                                                                                                  |

Run the API suite:

```bash
npm run build
npm run db:migrate:local
LAUNCH_MODE=live npx wrangler pages dev ./dist --port 8788 --compatibility-date=2026-09-01 &
E2E_BASE_URL=http://127.0.0.1:8788 npx playwright test --project=api
```

## Manual: screen reader smoke tests (13.12)

**VoiceOver (macOS Safari)**

1. `Cmd+F5`. Land on Home. `VO+U` → Landmarks: expect banner, navigation "Main", main, contentinfo.
2. `VO+U` → Headings: one H1, logical H2s.
3. Tab to "Open cart" / "Search rugs": names announced. Open search: combobox announced, type "oushak", arrow down through options, Enter navigates.
4. Product page: purchase panel reads badges → title → Rug ID → size → price → fiber content → availability (live region) → CTAs. Facts table reads as term/definition pairs.
5. Open the lightbox: "Image viewer" dialog; arrows move; Escape closes and focus returns to the trigger.
6. Waitlist form: submit empty → summary announced and focused; links move focus to fields; errors announced.

**NVDA (Windows Chrome/Firefox)**

1. `Insert+F7` elements list: landmarks, headings, links all named sensibly.
2. Browse mode through the mobile drawer (narrow window): accordion "Shop rugs" announces expanded/collapsed.
3. Cart drawer: line items announce availability text, remove buttons have rug names.
4. Filter sidebar: checkboxes announce label and matching count; price slider thumbs announce "Price range minimum/maximum" with values; number inputs work.

Record findings in the PR. Anything that blocks task completion is a launch blocker.

## Cross-device checklist (21)

Widths 360 / 390 / 412 / 768 / 1024 / 1440 / 1920 · iOS Safari · Android Chrome · desktop Chrome, Safari, Firefox, Edge. Check: sticky buy bar respects the safe area, filter drawer Apply button reachable, no hover-only interactions, inputs don't trigger iOS zoom, hero video pauses.
