# Storefront Build Prompt: One-of-a-Kind Turkish Rugs DTC (Cloudflare-hosted)

Prepared for Chris C on Sep 28, 2026. The product and model facts below were checked by web search on that date.

## Which tool to use: Claude Code, with Claude Design optionally first

**Use Claude Code to build the site.** Your note said "Claude code fable 5.1". That is two different things:

- **Claude Code** is Anthropic's coding agent. It runs in your terminal or desktop app, writes files, installs packages, runs the site locally, and deploys it.
- **Claude Fable 5.1** is a model, released Sep 1, 2026 (model ID `claude-fable-5-1`). Anthropic describes it as its most capable generally available model, best for long-running agentic work. It costs $10 / $50 per million tokens. Sources: https://www.anthropic.com/claude/fable ; https://platform.claude.com/docs/en/models/fable-5-1/overview
- **Claude Opus 5.5** was released Sep 22, 2026 and became the default Opus model in Claude Code v2.1.280. Reports say it matches or beats Fable 5.1 on most coding benchmarks and costs $4 / $20. Sources: https://datanorth.ai/news/anthropic-releases-claude-opus-5-5 ; https://claude-news.today/en/briefings/briefing-2026-09-23/

**Claude Design** is real. It is an Anthropic Labs product that launched Apr 17, 2026 and is still in beta. It makes visual prototypes, landing pages, and slides. It can export HTML and **hand off to Claude Code** (commands `/design-sync` and `/design`). It is included with Pro, Max, Team, and Enterprise plans. Sources: https://www.anthropic.com/news/claude-design-anthropic-labs ; https://claude.com/product/design ; https://itbrief.news/story/anthropic-expands-claude-design-with-new-connectors

**Why Claude Code, in plain words.** Your store has to actually work. That means taking payments through Stripe, marking a rug sold so nobody else can buy it, saving waitlist signups, sending purchase events to Meta, and going live on Cloudflare. Claude Design draws the storefront. Claude Code builds the machine behind it and puts it online. Claude Design by itself would leave you with a pretty mockup and no checkout.

**Recommended workflow:**

1. **Optional, about 1 hour: Claude Design.** Paste Section 3 (the design system) and the Home and Product page specs. Iterate until the look is right, then hand off to Claude Code.
2. **Claude Code does the build.** Use the default model (Opus 5.5). Switch to Fable 5.1 (`/model claude-fable-5-1`) only if a long, complex step keeps failing.
3. **Run the phases in Section 20 one at a time.** Test after each phase before moving on.

## How to use this file

1. Install Claude Code (see Anthropic's docs) and make an empty folder, e.g. `rug-store/`. Save this file inside it as `BUILD_SPEC.md`.
2. Start Claude Code in that folder and say: **"Read BUILD_SPEC.md. Execute Phase 0 only, then stop and show me what you did and what I need to set up."**
3. After each phase, run the site locally (`npm run dev`), click through it, and then say "Phase 1", "Phase 2", and so on.
4. Replace everything in `[BRACKETS]`: brand name, domain, phone, address, and keys. **Never paste secret keys into chat.** Put them in `.dev.vars` locally and in Cloudflare/Wrangler secrets for production. Claude will show you where.
5. The sample rugs are placeholders. Your real catalog goes in `src/data/products.json` or in Airtable (Phase 7).

---

# THE PROMPT (everything below this line is for Claude Code)

You are a senior full-stack engineer, e-commerce UX designer, and accessibility specialist. Build the complete storefront described below. Work **phase by phase** (Section 20). After each phase:

- stop
- summarize what changed
- list any manual setup steps for me
- run the build and tests

Do not start the next phase until I say so.

**Ground rules**

- Never invent facts about products. Use clearly marked placeholder data.
- Never commit secrets.
- Prefer boring, well-documented tools.
- Keep client-side JavaScript minimal.
- Every requirement below is **MUST** unless it is marked SHOULD or MAY.

## 1. Project overview

**1.1** **Business:** a direct-to-consumer store selling **one-of-a-kind, hand-knotted Turkish rugs** (new and vintage, Oushak, village, kilim) to US customers.

**1.2** **Founder:** Chris, a US-based founder who sources and films every rug on location in Turkey. Brand name: `[BRAND NAME]`. Domain: `[DOMAIN]`.

**1.3** **Positioning:** "Real Turkish rugs. Verified at the loom." Every rug has its own provenance page with:

- a back-of-rug knot video
- workshop or region details
- fiber and dye details
- a signed certificate

Prices are honest and fixed, duties are included, returns are accepted for 30 days, and support is US-based.

**1.4** **Inventory model:** each rug is a unique SKU with quantity 1. It must never be sold twice.

**1.5** **Primary goals, in priority order:**

1. Waitlist signups (pre-launch).
2. Purchases.
3. Booked video consultations.
4. Designer trade applications.

**1.6** **Audiences:**

- Design-conscious homeowners aged 30–65, researching $800–$4,000 purchases.
- Interior designers who need fast approvals.

**1.7** **Voice:** warm, plainspoken, confident, and first-person from Chris. It is lightly irreverent about tourist-shop haggling.

- **Banned:** fake discounts, countdown timers, "investment" claims, and the word "silk" unless the product data says `pileFiber` includes silk.

## 2. Tech stack and Cloudflare deployment

**2.1** **Framework:** Astro (latest stable) with `output: 'static'` for pages. Dynamic endpoints live in **Cloudflare Pages Functions** (`/functions`, TypeScript). Use the Cloudflare adapter only if it's needed for hybrid routes.

**2.2** **Styling:** Tailwind CSS with design tokens from Section 3, defined as CSS custom properties and mapped in `tailwind.config`.

**2.3** **Interactivity:** small framework-free islands (vanilla TS or Preact) for:

- gallery
- filters
- search
- cart drawer
- forms
- availability badges

The JS budget is in Section 12.

**2.4** **Data:**

- `src/data/products.json` is the build-time catalog.
- **Cloudflare KV** `RUG_STATUS` holds live availability.
- **Cloudflare D1** `DB` holds waitlist, trade applications, requests, reviews, orders, and reservations.
- **Cloudflare R2** `UPLOADS` holds customer room photos and review photos.

**2.5** **Media:**

- **Cloudflare Images** delivery: `https://imagedelivery.net/[ACCOUNT_HASH]/[IMAGE_ID]/[variant]`. Variants: `thumb` (400w), `card` (800w), `gallery` (1600w), `zoom` (2800w), `og` (1200x630).
- **Cloudflare Stream** for video, embedded with the Stream player (iframe), using `poster` and `preload="none"`.

**2.6** **Payments:** **Stripe Checkout** sessions are created server-side, with:

- `automatic_tax` (Stripe Tax)
- Apple Pay and Google Pay
- Affirm and Klarna, if enabled in the Stripe dashboard
- US shipping addresses only
- promotion codes (trade discounts)

Do not use static Payment Links.

**2.7** **Email:** transactional email through Stripe receipts plus `[EMAIL PROVIDER: Kit or Klaviyo]` via API for marketing lists. Admin notifications go through a Worker using `[MAILCHANNELS/Resend/Postmark]`. Make this pluggable.

**2.8** **Spam protection:** Cloudflare **Turnstile** on every public form.

**2.9** **Analytics:**

- Cloudflare Web Analytics
- GA4
- Meta Pixel, plus Meta Conversions API sent server-side from Functions

Details are in Section 15.

**2.10** **Config files:**

- `wrangler.toml` with bindings `DB`, `RUG_STATUS`, `UPLOADS` and vars.
- `.dev.vars.example` listing:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `TURNSTILE_SECRET`
  - `PUBLIC_TURNSTILE_SITEKEY`
  - `META_PIXEL_ID`
  - `META_CAPI_TOKEN`
  - `GA4_ID`
  - `EMAIL_API_KEY`
  - `EMAIL_LIST_ID`
  - `ADMIN_EMAIL`
  - `DEPLOY_HOOK_URL`
  - `AIRTABLE_TOKEN`
  - `AIRTABLE_BASE_ID`
  - `CF_IMAGES_HASH`
  - `ADMIN_ACCESS_AUD`

**2.11** **Deploy:** GitHub repo, connected to a Cloudflare Pages project. Production branch `main`, preview deploys on PRs. Custom domain `[DOMAIN]` with `www` redirecting to the apex (or the reverse, but pick one). HTTPS only, with HSTS.

**2.12** **Security headers** (via `public/_headers`):

- Content-Security-Policy allowing only Stripe, Cloudflare Images/Stream, Turnstile, GA4, Meta, and the email provider
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera and mic off)
- `frame-ancestors 'none'`

**2.13** **Redirects:** `public/_redirects` for legacy URLs and trailing-slash normalization.

**2.14** **Tooling:**

- TypeScript strict mode, ESLint, Prettier
- Vitest for unit tests
- Playwright for end-to-end tests
- `@axe-core/playwright` for accessibility tests
- Lighthouse CI for performance budgets

**2.15** **README:** a step-by-step setup guide. Cover:

- Cloudflare account
- Pages project
- creating D1, KV, and R2
- running migrations
- Images and Stream setup
- Stripe keys, webhook endpoint, enabling Stripe Tax and origin address
- Turnstile keys
- the deploy hook
- the custom domain
- the Cloudflare Access policy for `/admin`

## 3. Design system

### 3.1 Color tokens (hex)

| Token                  | Hex     | Use                                                       |
| ---------------------- | ------- | --------------------------------------------------------- |
| `--color-ivory`        | #F6F1E9 | Page background                                           |
| `--color-sand`         | #E9DFCF | Section backgrounds, cards                                |
| `--color-madder`       | #9E2B25 | Primary buttons, links, accents                           |
| `--color-madder-dark`  | #7C1F1B | Primary hover/pressed                                     |
| `--color-indigo`       | #23395B | Headings, footer background, secondary buttons            |
| `--color-indigo-light` | #3E5A86 | Secondary hover                                           |
| `--color-saffron`      | #D9A441 | Badges, highlights (never for text on ivory)              |
| `--color-olive`        | #6B7B4B | "Available" state, success                                |
| `--color-charcoal`     | #2B2B2B | Body text                                                 |
| `--color-stone`        | #6E6A64 | Secondary text (verify ≥4.5:1 on ivory; darken if needed) |
| `--color-line`         | #D8CFC0 | Borders, dividers                                         |
| `--color-error`        | #B3261E | Errors                                                    |
| `--color-white`        | #FFFFFF | Surfaces on sand                                          |

Contrast rules:

- Body text 4.5:1 or better.
- Large text and UI components 3:1 or better.
- Write a unit test that checks every token pair used for text against these ratios.

### 3.2 Typography

- **Display:** "Fraunces" (variable, opsz), weights 400/600. **Body/UI:** "Inter" (variable), weights 400/500/600.
- Self-host with `font-display: swap`. Preload only the two primary files and subset to Latin.
- Fluid type scale using `clamp()`:

| Style   | Size    |
| ------- | ------- |
| Display | 44→72px |
| H1      | 36→56   |
| H2      | 28→40   |
| H3      | 22→28   |
| H4      | 18→22   |
| Body-lg | 18→20   |
| Body    | 16→17   |
| Small   | 14      |
| Caption | 13      |

- Line height 1.1–1.2 for headings, 1.6 for body. Max line length 70ch.
- Numbers such as sizes and prices use `font-variant-numeric: tabular-nums`.

### 3.3 Spacing, grid, and radius

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, exposed as `--space-1`…`--space-10`.
- **Grid:** 12 columns, max content width 1280px, wide media max 1600px.
- **Gutters:** 16px mobile, 24px tablet, 32px desktop. **Section vertical padding:** 64px mobile, 96–128px desktop.
- **Radius:** 4px for inputs and buttons, 8px for cards, 0 for full-bleed media. **Shadows:** a single subtle elevation for drawers and modals only.

### 3.4 Breakpoints

- **Width breakpoints:**

| Name  | Min width |
| ----- | --------- |
| `sm`  | 480px     |
| `md`  | 768px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |
| `2xl` | 1536px    |

- Design mobile-first. Test at 360, 390, 768, 1024, 1440, and 1920 wide.
- **Product grid columns by breakpoint:**

| Breakpoint | Columns        |
| ---------- | -------------- |
| Base       | 1              |
| `sm`       | 2              |
| `lg`       | 3              |
| `xl`       | 4 (collection) |

### 3.5 Motion

- **Durations:** 150ms (hover), 250ms (drawers and accordions), 400ms (page-level fades). Easing `cubic-bezier(0.2, 0, 0, 1)`.
- **Allowed:** fades, small translate (≤8px), image crossfades, drawer slides.
- **Not allowed:** parallax, scroll-jacking, auto-advancing carousels.
- Respect `prefers-reduced-motion`. When it's set, disable all non-essential motion and the hero video autoplay (show the poster instead).

### 3.6 Iconography

- **Lucide** icons, inline SVG, 1.5px stroke. Sizes 20px (UI) and 24px (nav).
- Every icon-only button has an `aria-label`. Decorative icons get `aria-hidden="true"`.
- **Custom icons:** knot/loom, flip test, certificate, duties-included, returns, US flag/support.

### 3.7 Imagery rules

- **Photos:** natural daylight, true-to-color, with a white-balance card during the shoot. No heavy filters.
- **Required shots per rug:**
  - full front, straight-on
  - full back
  - 2 corner close-ups
  - fringe/selvedge
  - texture macro
  - room-scale with furniture
  - person-for-scale
  - at least one lifestyle shot
- **Aspect ratios:** 4:5 for cards, the rug's own ratio in the gallery, 16:9 for heroes and room shots.
- **Performance:** always set width and height or aspect-ratio (no layout shift). Use `srcset`/`sizes`. AVIF/WebP comes automatically from Cloudflare Images.
- **Alt text pattern:** "[Style] rug, [size], [main colors], [view: front/back/detail]". Room shots describe the setting.

### 3.8 Components (build as reusable Astro components with documented props)

- **Buttons:** Button (primary/secondary/ghost/link, sizes sm/md/lg, loading and disabled states), IconButton.
- **Media:** RugCard, Badge (One of one / New arrival / Vintage / Sold / Reserved / Trade), PriceTag (with "Duties included" microcopy), Gallery with Lightbox, VideoEmbed (Stream).
- **Content and layout:** FactsTable, Accordion, Tabs, TrustBar, SectionHeader, Breadcrumbs, Pagination/"Load more", ReviewCard, StarRating, Testimonial.
- **Overlays and messaging:** Toast, Modal, Drawer (cart, filters, menu), Skeleton, EmptyState, ErrorState.
- **Forms:** FormField (label, hint, error), Select, Checkbox, RadioGroup, RangeSlider (dual-thumb price), ColorSwatchFilter, NewsletterForm.
- **Structure:** Header, MegaMenu, Footer, AnnouncementBar, StickyBuyBar (mobile), CookieNotice (only if needed).
- **Showcase:** create `/styleguide` (noindex) that shows every component in every state.

## 4. Information architecture and navigation

**4.1** **Routes:**

| Route                       | Page                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `/`                         | Home                                                                        |
| `/rugs`                     | All rugs                                                                    |
| `/rugs/[slug]`              | Product page                                                                |
| `/collections/[collection]` | e.g., `oushak`, `vintage`, `kilim`, `runners`, `new-arrivals`, `under-1000` |
| `/sizes/[size]`             | `4x6`, `5x8`, `6x9`, `8x10`, `9x12`, `runner`                               |
| `/about`                    | About                                                                       |
| `/authenticity`             | Authenticity guide                                                          |
| `/care`                     | Care guide                                                                  |
| `/trade`                    | Trade program                                                               |
| `/book`                     | Book a video consultation                                                   |
| `/waitlist`                 | Waitlist landing page                                                       |
| `/reviews`                  | Reviews                                                                     |
| `/faq`                      | FAQ                                                                         |
| `/shipping-duties`          | Shipping & duties                                                           |
| `/returns`                  | Returns                                                                     |
| `/privacy`                  | Privacy                                                                     |
| `/terms`                    | Terms                                                                       |
| `/accessibility`            | Accessibility statement                                                     |
| `/contact`                  | Contact                                                                     |
| `/search`                   | Search                                                                      |
| `/cart`                     | Cart fallback page                                                          |
| `/checkout/success`         | Checkout success                                                            |
| `/checkout/cancel`          | Checkout cancelled                                                          |
| `/admin`                    | Admin (protected)                                                           |
| `/styleguide`               | Component showcase                                                          |
| `/404`                      | Not found                                                                   |
| `/500`                      | Server error                                                                |

**4.2** **Announcement bar** (dismissible, remembered in localStorage): "Duties & US shipping included · 30-day returns · Every rug filmed at the source".

**4.3** **Header (desktop):**

- Logo on the left.
- Nav in the center:
  - **Shop rugs** (mega menu with columns: By size / By style / By region / Featured, plus one image tile of the latest drop)
  - Authenticity
  - About
  - Trade
- Utilities on the right: Search (icon opening a search overlay), Book a live look (text link), Cart (icon + count badge).

**4.4** **Header behavior:** sticky, shrinking from 80px to 64px after scrolling 80px, with a solid ivory background. On the home hero it starts transparent over the video, with contrast ensured by a gradient scrim.

**4.5** **Mobile header:** hamburger (left), logo (center), search and cart (right). The menu is a full-height drawer with accordion sections, large tap targets (48px or more), and contact info at the bottom.

**4.6** **Footer (indigo background, ivory text):**

- Column 1: Shop links
- Column 2: Help links (FAQ, Shipping & duties, Returns, Care, Contact)
- Column 3: Company links (About, Authenticity, Trade, Reviews)
- Column 4: Newsletter form
- Below the columns:
  - US business address `[ADDRESS]`, phone `[PHONE]`, email
  - Social icons (Instagram, TikTok, Pinterest, YouTube)
  - Payment icons
  - "All rugs are imported from Turkey." plus the textile disclosure line
  - Legal links and ©

**4.7** **Breadcrumbs:** on collection, product, and guide pages (with BreadcrumbList schema).

**4.8** **Skip link:** "Skip to main content" as the first focusable element on every page.

## 5. Home page (sections in order, with states)

**5.1** **Hero:**

- Full-bleed Stream video loop (muted, playsinline, loop, 10–20s) of hands knotting, then a rug flip, then a room shot, with a poster image.
- Overlay:
  - H1 "Real Turkish rugs. Verified at the loom."
  - Subhead "Hand-knotted, one of one, filmed at the source. Duties included. 30-day returns."
  - Primary CTA "Shop the collection" → `/rugs`. Secondary CTA "Join the drop list" → scrolls to the waitlist form.
- Pause/play button (WCAG 2.2.2).
- **Reduced motion or save-data:** static image instead of video.
- **Pre-launch mode** (env `LAUNCH_MODE=waitlist`): the primary CTA becomes "Join the drop list" and prices are hidden site-wide behind "Price revealed at launch".

**5.2** **Trust bar:** 5 icon+label items: Hand-knotted & verified · Duties included · 30-day returns · US-based support · Secure checkout. It scrolls horizontally on mobile with snap points, no auto-scroll.

**5.3** **Latest drop:**

- H2 "Just in from [Region]". Show 8 RugCards sorted by `dateAdded` descending, with "View all rugs" at the end.
- **Loading:** skeleton cards. **Empty:** "The next drop is on its way — join the list." with a form.

**5.4** **How I verify every rug:** 3 steps with icons and short copy:

1. The flip test (back-of-rug knot video).
2. Fiber & dye check (burn test, fiber, and dyes documented).
3. Signed certificate with a unique rug ID.

Link: "Read the authenticity guide".

**5.5** **Meet Chris:** a 60–90s video (Stream) plus a 3-sentence story and a signature image. CTA "Book a live video look".

**5.6** **Shop by size:** 6 tiles with an icon showing relative size and a room hint (4x6 entry, 5x8 living, 8x10 living/dining, 9x12 large room, runners hall).

**5.7** **Shop by style:** Oushak, Village/Tribal, Vintage, Kilim, Overdyed, Modern Anatolian (only show styles that have at least one rug; otherwise hide the tile).

**5.8** **In real homes:** a customer or styled room photo grid (6 images), each linking to its rug. Hide the section until at least 3 exist.

**5.9** **Reviews:** 3 ReviewCards plus the aggregate rating, linking to `/reviews`. Hide until at least 3 approved reviews exist. Never show fake reviews.

**5.10** **Trade teaser:** "Designers: 15% trade pricing, curated shortlists in 24 hours." CTA "Apply for trade".

**5.11** **Waitlist / drop list form:**

- Fields: first name (optional), email (required), interests (checkboxes: sizes and styles), plus Turnstile.
- **Success:** inline message plus a "Follow the sourcing trip on Instagram" link.
- **Already subscribed:** a friendly message.

**5.12** **Press/as-seen-in:** hidden until real press exists.

## 6. Collection, search, and filters

**6.1** **Collection page layout:**

- H1 with the collection name, a 1–2 sentence intro (SEO copy), and a result count ("24 rugs · 6 available").
- Controls: sort (Newest, Price low–high, Price high–low, Size small–large) and a filter button (mobile) or left sidebar (desktop ≥1024px).

**6.2** **Filters.** All filters are multi-select unless noted, and the facet counts update live.

- **Size:** by named bucket (`4x6`, `5x8`, `6x9`, `8x10`, `9x12`, `10x14+`, `Runner`, `Small <4x6`), plus a width and length range in feet (dual sliders). Include a ft/cm toggle that persists in localStorage.
- **Style:** Oushak, Village/Tribal, Kilim (flatweave), Vintage, Overdyed, Modern Anatolian, Silk (only shown if a rug has it).
- **Region:** Uşak, Konya, Kayseri, Isparta, Milas, Kars, Anatolian (unspecified). Values come from the product data.
- **Color:** swatches (ivory, beige, red, rust, blue, green, gold, pink, gray, multi). Each rug has 1–3 `colors`. Every swatch has a text label.
- **Price:** dual range slider plus min/max inputs, with preset chips (<$1,000 / $1,000–2,000 / $2,000–3,000 / $3,000+).
- **Condition/age:** New (0–5 yrs), Semi-antique/vintage (20–50 yrs), Antique (100+ yrs).
- **Pile type:** Pile (knotted), Flatweave.
- **Availability:** toggle "Show sold rugs", off by default. Sold rugs appear with a "Sold" badge as social proof when it's on.

**6.3** **Filter behavior:**

- Client-side filtering over a prebuilt JSON index (`/rugs-index.json`, only the fields needed).
- State is reflected in the URL query (`?size=8x10&style=oushak&color=blue&min=1000&max=3000`) so it's shareable and back-button friendly.
- Applied filters show as removable chips with a "Clear all" link.
- On mobile, filters open in a full-screen drawer with an "Apply (N rugs)" sticky button.
- The result count is announced via an `aria-live="polite"` region.

**6.4** **Pagination:** a "Load more" button (24 per page) that updates the URL `?page=`, plus crawlable paginated links for SEO. No infinite scroll.

**6.5** **Empty result:** "No rugs match those filters." Offer buttons to clear the last filter or clear all, plus a "Tell me when a rug like this arrives" form that saves the current filters as a request to D1.

**6.6** **Search:**

- Header overlay with an input, instant results (top 6 rugs, top 3 guide articles) using a prebuilt client index (MiniSearch or Fuse over title, style, region, colors, size, and ID).
- Typo tolerance. Keyboard navigable (arrow keys, Enter, Esc) and implemented as an ARIA combobox.
- **No results:** suggestions (popular searches: "8x10 Oushak", "runner", "vintage") plus a link to book a live look.
- `/search?q=` shows a full results page.
- Searching a rug ID (e.g., "TR-0042") jumps straight to that product.

**6.7** **RugCard:**

- 4:5 image, with a second image (back or room) swapped in on hover on desktop only.
- Badges, title, size (ft and cm), region, and price with "Duties included".
- Wishlist heart (localStorage, no account needed; SHOULD).
- The whole card is one link, and the heart is a separate button.
- **Sold:** grayscale 30% plus a "Sold" badge, with the price hidden or struck through. **Reserved:** "In someone's cart" badge.

## 7. Product page (field-by-field spec)

**7.1** **Product data schema** (`products.json`; validate with Zod at build time, and fail the build on invalid data):

| Field               | Type                                                                                 | Required      | Display                                                               |
| ------------------- | ------------------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------- |
| `id`                | string, e.g. "TR-0042"                                                               | yes           | "Rug ID" in facts, certificate, URL fallback                          |
| `slug`              | string                                                                               | yes           | URL `/rugs/[slug]`                                                    |
| `title`             | string                                                                               | yes           | H1, e.g., "Vintage Oushak, Faded Coral & Sage"                        |
| `style`             | enum                                                                                 | yes           | Facts; filters; breadcrumbs                                           |
| `collection`        | string[]                                                                             | yes           | Collection membership                                                 |
| `condition`         | enum new/vintage/antique                                                             | yes           | Badge; facts                                                          |
| `ageYears` or `era` | number or string                                                                     | yes           | Facts ("circa 1970s")                                                 |
| `sizeFt`            | {w: number, l: number} in feet+inches decimals                                       | yes           | "5′ 2″ × 8′ 1″"                                                       |
| `sizeCm`            | {w, l}                                                                               | yes           | "157 × 246 cm"                                                        |
| `sizeBucket`        | enum                                                                                 | yes           | Filters                                                               |
| `pileFiber`         | string, e.g. "100% wool"                                                             | yes           | Facts; **FTC fiber content**                                          |
| `foundationFiber`   | string, e.g. "cotton warp and weft"                                                  | yes           | Facts                                                                 |
| `fiberContentLabel` | string (full legal fiber statement)                                                  | yes           | Near the price + facts                                                |
| `construction`      | enum hand-knotted/flatweave                                                          | yes           | Facts; filter                                                         |
| `knotType`          | string, e.g. "symmetrical (Turkish/Ghiordes)"                                        | no            | Facts                                                                 |
| `kpsi`              | number (knots per square inch)                                                       | no            | Facts, with tooltip explaining KPSI                                   |
| `pileHeightMm`      | number                                                                               | no            | Facts                                                                 |
| `dyeType`           | enum natural/synthetic/mixed/unknown                                                 | yes           | Facts (be honest: "unknown" is allowed)                               |
| `region`            | string                                                                               | yes           | Facts; filter; provenance map                                         |
| `village`           | string                                                                               | no            | Facts                                                                 |
| `workshop`          | string                                                                               | no            | Provenance section                                                    |
| `weaverNote`        | string                                                                               | no            | Provenance section                                                    |
| `colors`            | string[1–3]                                                                          | yes           | Filters; alt text                                                     |
| `weightKg`          | number                                                                               | yes           | Facts; shipping calc                                                  |
| `conditionNotes`    | string                                                                               | yes           | Facts ("Even low pile; one small repair at corner, shown in photo 7") |
| `priceUsd`          | integer                                                                              | yes           | Price                                                                 |
| `compareAtUsd`      | —                                                                                    | **forbidden** | No strike-through "was" prices                                        |
| `dutiesIncluded`    | boolean                                                                              | yes           | "Duties & US shipping included"                                       |
| `shippingNote`      | string                                                                               | yes           | "Ships from [US/Turkey] in X–Y business days"                         |
| `images`            | {id, alt, kind: front/back/corner/fringe/macro/room/scale/lifestyle}[] (≥6)          | yes           | Gallery in the order given                                            |
| `videos`            | {streamId, kind: flip/walkthrough/workshop, poster, caption, transcript}[] (≥1 flip) | yes           | Video section                                                         |
| `certificatePdf`    | URL                                                                                  | yes           | Download link                                                         |
| `description`       | markdown (150–300 words)                                                             | yes           | Story section                                                         |
| `careLevel`         | string                                                                               | no            | Care snippet                                                          |
| `tags`              | string[]                                                                             | no            | Search                                                                |
| `dateAdded`         | ISO date                                                                             | yes           | Sorting; "New" badge (≤21 days)                                       |
| `status`            | available/reserved/sold (build default; live value from KV)                          | yes           | Badge; CTA state                                                      |
| `seo`               | {title?, description?}                                                               | no            | Meta overrides                                                        |

**7.2** **Layout, desktop at 1024px and up.** Left 7 columns: gallery. Right 5 columns (sticky): purchase panel. Below: full-width sections.

**7.3** **Gallery:**

- Main image plus a vertical thumbnail rail. Click or tap opens a full-screen lightbox with pinch-zoom and pan, swipe, arrow keys, Esc, and focus trap.
- "View back of rug" is a quick-jump button. "Video" thumbnails show a play icon.
- On mobile: horizontal swipe with dots and a count ("3 / 11").
- **Room-scale toggle** (SHOULD): shows the room image with a size callout.

**7.4** **Purchase panel (in order):**

1. Badges.
2. H1 title.
3. Rug ID.
4. Size (ft/cm toggle).
5. Price, with "Duties & US shipping included" under it and an Affirm/Klarna "as low as" message (only if enabled).
6. Fiber content label.
7. Live availability indicator ("Available — one of one" in olive / "In someone's cart — check back in 30 min" / "Sold").
8. **Buy now** (primary; goes straight to checkout for a one-of-one rug).
9. **Add to cart** (secondary; for multi-rug orders).
10. **Book a live video look** (ghost; opens `/book?rug=TR-0042`).
11. "See it in my room" link (opens the room-mockup request form).
12. A mini-trust list: 30-day returns · Signed certificate · Secure checkout · Questions? Text/WhatsApp `[PHONE]`.

**7.5** **Button states:**

- Buy now: default, hover, focus-visible (2px indigo outline plus offset), loading ("Reserving your rug…" spinner), and disabled.
- If the rug is **reserved**, show the message plus a "Notify me if it frees up" email field.
- If **sold**, replace the CTAs with "This one found a home. Find me one like it" (a request form pre-filled with size, style, and colors) and show similar rugs.

**7.6** **Sections below the fold:**

- **a. The Flip Test:** the flip/knot video with its caption and transcript toggle.
- **b. Provenance:** region map pin (static SVG map of Turkey), village, workshop, weaver note, and Chris's sourcing note ("I found this one in…").
- **c. Facts table:** every non-empty field from 7.1, in a two-column definition list (`<dl>`), with tooltips for KPSI, knot type, and dye type.
- **d. Condition:** condition notes plus linked detail photos.
- **e. Certificate:** a thumbnail preview plus a PDF download with the rug ID.
- **f. Size guide:** a visual of the rug's footprint in typical room layouts, plus an "Order a rug pad" note (SHOULD).
- **g. Shipping, duties & returns:** an accordion with a summary and links.
- **h. Care:** a snippet linking to `/care`.
- **i. Reviews:** store-level reviews, since each rug is unique.
- **j. Similar rugs:** 4 cards matched by style, size bucket, and color.
- **k. Recently viewed:** localStorage.

**7.7** **Mobile product page:**

- Gallery first, then title, price, and availability. The CTAs sit in a **sticky bottom bar** (price + Buy now) that appears after the in-page CTA scrolls out of view and respects the iOS safe area.
- Sections collapse into accordions (Flip test and Provenance open by default).

**7.8** **Share:** copy link, Pinterest "Save" (with the image), and email. Use the Web Share API on mobile.

## 8. Cart and checkout flow

**8.1** **Cart:** a slide-over drawer from the right, with a full `/cart` page as the no-JS fallback. Stored in localStorage as rug IDs only. Prices and availability are **re-validated server-side** every time.

**8.2** **Cart line:** thumbnail, title, ID, size, price, a remove button, and live availability. If an item becomes sold, show an inline warning and exclude it from checkout.

**8.3** **Cart footer:**

- Subtotal
- "Duties & US shipping included"
- "Sales tax calculated at checkout"
- A trade-code note ("Trade members: enter your code at checkout")
- A **Checkout** button
- The trust row

**8.4** **Empty cart:** "Your cart is empty" with links to Latest drop and to book a live look.

**8.5** **Reservation and checkout (`POST /api/checkout`, body `{rugIds: string[]}`):**

- **a.** Validate the Turnstile token or rate limit (10 requests per minute per IP).
- **b.** For each rug, read KV `RUG_STATUS`. If it's not `available`, return 409 with the list of unavailable IDs.
- **c.** Atomically reserve each rug in D1 `reservations` (unique rugId, expires_at = now+30m). Use a D1 unique constraint so two buyers can't both reserve the same rug. Then mirror `reserved` into KV with a 30-minute TTL.
- **d.** Create the Stripe Checkout Session with:
  - line items using server-side prices from the catalog (never trust the client)
  - `automatic_tax: {enabled: true}`
  - `shipping_address_collection: {allowed_countries: ['US']}`
  - `shipping_options` set to free
  - `allow_promotion_codes: true`
  - `phone_number_collection`
  - `metadata: {rugIds}`
  - `expires_at` in 30 minutes
  - `success_url` = `/checkout/success?session_id={CHECKOUT_SESSION_ID}` and `cancel_url` = `/checkout/cancel`
  - `consent_collection` for promotional emails
  - `custom_text` summarizing the returns policy
- **e.** Return the session URL. The client redirects to it.

**8.6** **Webhook (`POST /api/stripe-webhook`):**

- Verify the signature.
- **`checkout.session.completed`:** mark rugs `sold` in KV (no TTL), insert the order into D1, send the Meta CAPI `Purchase` event (with dedup `event_id` = session ID), add the buyer to the email list if they consented, email the admin, and trigger `DEPLOY_HOOK_URL` (debounced to at most one call per 5 minutes).
- **`checkout.session.expired`:** release the reservations (delete the D1 row and set KV back to `available`).
- **`charge.refunded`:** alert the admin. Do not auto-relist the rug; relisting is manual in the admin.
- **Idempotency:** store processed event IDs in D1.

**8.7** **Success page:**

- Order summary (fetched by `session_id` server-side), the "what happens next" timeline (Packed → Shipped with tracking → Delivered), certificate note, care guide link, and a referral/share prompt.
- Fire GA4 `purchase` and the Pixel `Purchase` with the same `event_id`.

**8.8** **Cancel page:** "No problem — your rug is held for a few more minutes." Show the remaining time and buttons to return to checkout or the cart.

**8.9** **Live status endpoint (`GET /api/status?ids=`):** returns `{id: status}` from KV. Edge-cache it for 10 seconds. The product and collection islands call it on load and on visibility change.

**8.10** **Trade pricing:** approved designers get a Stripe promotion code (15%) that's restricted to them where possible. Trade orders are tagged in D1.

## 9. Trust elements (required placements)

**9.1** **Everywhere:** the announcement bar, the footer with US address and phone, secure checkout icons, and the textile disclosure.

**9.2** **Product page:** flip video, certificate, provenance, facts, condition photos, returns summary, live chat/WhatsApp link, and booking CTA.

**9.3** **Checkout:** Stripe-hosted, with Apple/Google Pay, a returns note, and a support email.

**9.4** **Content pages:**

- **About:** founder story, photos from the sourcing trips, and "Why fixed prices".
- **Authenticity guide:** how to tell hand-knotted from machine-made, silk vs art silk (viscose), what KPSI means, natural vs synthetic dyes, and what the certificate means.
- **Guarantee statement:** "If an independent appraiser finds that a rug isn't what we described, we'll refund you in full, including return shipping."

**9.5** **Reviews:** only real, verified-purchase reviews. Show the aggregate only when there are 3 or more. Link to the Google Business Profile.

**9.6** **FTC compliance:** every product listing and ad landing page states the fiber content, "Imported" / "Made in Turkey", and the dealer name.

## 10. Content pages (sections)

**10.1** **About:**

- Hero photo of Chris at a workshop
- Story (3 short paragraphs)
- "What we do differently" (4 points)
- Sourcing map
- Photo/video wall
- Values
- Contact CTA

**10.2** **Authenticity:** a long-form guide (1,500–2,500 words placeholder outline) with a table of contents (sticky on desktop), diagrams (knot types), photo comparisons, and a FAQ block (FAQPage schema).

**10.3** **Care:** vacuuming, rotation, spills, professional cleaning, rug pads, and storage, laid out as an accordion or anchored sections.

**10.4** **Trade:**

- Benefits
- How it works (Apply → Approved within 48h → Shortlists → Memo/approval → Order)
- Application form
- Trade FAQ

**10.5** **Book a live look (`/book`):**

- Explanation plus an embedded scheduler (`[Cal.com or Calendly URL]`, lazy-loaded on click to protect performance). Pre-fill the rug ID from the query string.
- Alternative: a "Text/WhatsApp [PHONE]" button.

**10.6** **Shipping & duties, Returns, FAQ, Privacy, Terms, Accessibility statement, Contact:** clear headings, short paragraphs, and last-updated dates.

**10.7** **Returns specifics (placeholder policy for Chris to edit):**

- 30 days from delivery.
- The rug must be in its original condition.
- Prepaid return label cost deducted or free (`[CHOOSE]`).
- Refund within 5 business days of receipt.
- How to start: a form at `/returns#start` that creates a D1 record and emails the admin.

## 11. Forms and email capture

**11.1** **Forms and their fields.** All forms use Turnstile, server-side validation (Zod), a honeypot field, rate limiting, D1 storage, admin email notification, and a success/error UI.

| Form                                              | Fields                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Waitlist                                          | email*, first name, interests[], source (hidden: UTM params)                                                   |
| Trade application                                 | name*, firm*, website*, email*, phone*, city/state*, project types, resale cert # (optional), how did you hear |
| "Find me one like this" / filter request          | email*, size, style, colors, budget range, notes, prefilled criteria                                           |
| "Notify me if it frees up"                        | email*, rugId (hidden)                                                                                         |
| See it in my room                                 | email*, rugId, room photo upload (R2, ≤10MB, jpg/png/heic, strip EXIF), room dimensions, notes                 |
| Contact                                           | name*, email*, subject, message*, rugId (optional)                                                             |
| Return request                                    | order email*, order number*, rugId*, reason, photos                                                            |
| Review (link from post-purchase email, tokenized) | rating 1–5*, title, text*, photo, display name*, city; stored `pending` until approved in admin                |

**11.2** **Form UX:**

- Visible labels (never placeholder-only).
- Required fields marked with text as well as an asterisk.
- Inline validation on blur. An error summary at the top on submit, focused and linking to each field.
- Correct `autocomplete` attributes and input types (`email`, `tel`).
- The submit button shows a loading state and prevents double submission.

**11.3** **Email marketing:**

- Double opt-in if the provider supports it.
- Tag subscribers by interests and source.
- Welcome series (3 emails) is set up in the provider, not in code. Document the tags in the README.

**11.4** **Exit-intent or timed popup:** SHOULD be off by default. If enabled, show it once per 14 days, never on mobile within the first 30 seconds, and make it easy to close (Esc, close button, click outside).

## 12. Performance budgets

**12.1** **Core Web Vitals (p75, mobile):**

| Metric | Target                  |
| ------ | ----------------------- |
| LCP    | ≤2.0s (hard fail >2.5s) |
| INP    | ≤200ms                  |
| CLS    | ≤0.05 (hard fail >0.1)  |
| TTFB   | ≤600ms                  |

**12.2** **Lighthouse (mobile) on Home, Collection, and Product:** Performance 95 or higher, Accessibility 100, Best Practices 100, SEO 100. Enforce with Lighthouse CI in GitHub Actions.

**12.3** **Size budgets (compressed):**

| Asset        | Budget                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Critical CSS | ≤20KB inline                                                              |
| Total CSS    | ≤50KB                                                                     |
| JS per page  | ≤60KB (Home/Collection), ≤90KB (Product), excluding third-party analytics |
| Fonts        | ≤120KB total                                                              |
| Hero poster  | ≤150KB                                                                    |

**12.4** **Loading rules:**

- Only the LCP image is eager (`fetchpriority="high"`). Everything else is lazy.
- Stream players are click-to-load, except the hero loop.
- The scheduler, reviews widget, and chat load on interaction.
- GA4 and Pixel load after first interaction or 3 seconds (SHOULD use Cloudflare Zaraz).

**12.5** **Caching:** HTML with short cache plus stale-while-revalidate. Hashed assets are immutable for 1 year. JSON indexes cache for 5 minutes.

## 13. Accessibility (WCAG 2.2 AA)

**13.1** **Structure:** semantic landmarks (header, nav, main, footer), one H1 per page, logical heading order, and the `lang="en"` attribute.

**13.2** **Keyboard:** everything is operable by keyboard. Focus order is visible and logical. `:focus-visible` shows a 2px indigo outline with 2px offset, and focus is never obscured by the sticky header or bar (2.4.11).

**13.3** **Targets:** tap targets are at least 24×24 CSS px minimum (2.5.8) and 44×44 for primary controls.

**13.4** **Modals and drawers:** focus trap, Esc to close, return focus to the trigger, `aria-modal`, and labelled titles.

**13.5** **Media:**

- All images have alt text (decorative ones use `alt=""`).
- Videos have captions and transcripts.
- Autoplaying video has pause controls.
- Nothing flashes more than 3 times per second.

**13.6** **Color:** contrast ratios as in 3.1. Information is never conveyed by color alone (swatches have labels, and status badges have text).

**13.7** **Forms:** labels, errors announced via `aria-describedby` / `aria-live`, and no CAPTCHA puzzles (Turnstile non-interactive; 3.3.8 Accessible Authentication).

**13.8** **Dragging alternatives (2.5.7):** the price slider has min/max number inputs, and the gallery has buttons as well as swipe.

**13.9** **Consistent help (3.2.6):** contact/help links appear in the same place on every page.

**13.10** **Redundant entry (3.3.7):** don't make users re-enter information within a flow (e.g., prefill the rug ID).

**13.11** **Reflow and zoom:** reflow at 320px, zoom to 200% and 400% without loss, and text spacing overrides must not break the layout.

**13.12** **Testing:** automated axe tests on every route in Playwright, a keyboard-only walkthrough script, and screen reader smoke tests (VoiceOver and NVDA) documented in `TESTING.md`.

## 14. SEO and structured data

**14.1** **Metadata:**

- Unique title (≤60 characters) and meta description (≤155) on every page.
- Canonical URLs. Open Graph and Twitter cards, with the product `og` image variant.
- `sitemap.xml` generated at build (sold rugs stay indexed for 90 days with SoldOut availability, then `noindex`, configurable). `robots.txt` disallows `/admin`, `/api`, `/checkout`, and `/styleguide`.

**14.2** **JSON-LD:**

- `Organization` (with logo, sameAs socials, contactPoint) and `WebSite` with `SearchAction` on Home.
- **`Product`** on every rug page, containing:
  - `name`, `description`, `sku`/`productID` = id, `image[]`, `brand`
  - `material` = pileFiber
  - `color`
  - `size` (as a text value)
  - `countryOfOrigin` = "TR"
  - `itemCondition` (NewCondition or UsedCondition for vintage)
  - `offers` with `price`, `priceCurrency` "USD", `availability` (InStock/SoldOut) from build status, `url`, `seller`
  - `shippingDetails` (free shipping to US) and `hasMerchantReturnPolicy` (30 days, US)
  - `aggregateRating` only when real reviews exist
- `BreadcrumbList` on collection and product pages. `FAQPage` on FAQ and the authenticity guide. `VideoObject` for the flip and workshop videos (name, description, thumbnailUrl, uploadDate, contentUrl/embedUrl).

**14.3** **Google Merchant Center feed:** `/feed.xml` (RSS 2.0 with g: namespace) including id, title, description, link, image_link, additional_image_link, availability, price, condition, brand, google_product_category "Home & Garden > Decor > Rugs", material, color, size, shipping, identifier_exists=no.

**14.4** **Content SEO:**

- Collection intros, size and style landing pages, and long-form guides (authenticity, "Oushak rugs explained", "What size rug do I need?").
- Internal links from guides to collections.
- Descriptive, lowercase-hyphen URLs.

**14.5** **Validation:** Rich Results Test-compatible markup. Add a unit test that validates the JSON-LD shape against the Product schema.

## 15. Analytics and events

**15.1** **Tools:** Cloudflare Web Analytics (always on, cookieless), GA4, Meta Pixel plus CAPI. Pinterest Tag and TikTok Pixel are MAY, behind config flags.

**15.2** **Consent:** a simple consent banner ONLY if required for the configured tags and regions (make it configurable). Respect Global Privacy Control / Do Not Track by not loading marketing tags.

**15.3** **Event map.** Build a single `track()` helper that fans out to each tool.

| Event                       | Trigger                          | GA4                       | Meta                      | Params                            |
| --------------------------- | -------------------------------- | ------------------------- | ------------------------- | --------------------------------- |
| page_view                   | route load                       | page_view                 | PageView                  | path, referrer, utm_*             |
| view_item_list              | collection/search results render | view_item_list            | —                         | list_name, item_ids               |
| select_item                 | RugCard click                    | select_item               | —                         | item_id, list_name, position      |
| view_item                   | product page                     | view_item                 | ViewContent               | item_id, price, style, size       |
| filter_apply                | filter change                    | filter_apply (custom)     | —                         | filter_type, value, result_count  |
| search                      | search submit                    | search                    | Search                    | search_term, result_count         |
| add_to_cart                 | add to cart                      | add_to_cart               | AddToCart                 | item_id, price                    |
| begin_checkout              | checkout click                   | begin_checkout            | InitiateCheckout          | item_ids, value                   |
| checkout_blocked            | 409 reserved/sold                | checkout_blocked (custom) | —                         | item_id, status                   |
| purchase                    | success page + webhook CAPI      | purchase                  | Purchase (dedup event_id) | transaction_id, value, tax, items |
| generate_lead               | waitlist/request/notify submit   | generate_lead             | Lead                      | form_type                         |
| trade_apply                 | trade form submit                | trade_apply (custom)      | Lead                      | —                                 |
| book_call                   | scheduler click / booking        | book_call (custom)        | Schedule                  | item_id                           |
| video_play / video_complete | Stream player events             | custom                    | —                         | video_kind, item_id               |
| gallery_back_view           | "View back" clicked              | custom                    | —                         | item_id                           |
| unit_toggle                 | ft/cm toggle                     | custom                    | —                         | unit                              |

**15.4** **UTM capture:** capture UTMs on first landing and store them in sessionStorage. Attach them to form submissions and Stripe metadata.

**15.5** **Debug mode:** `?debug_analytics=1` logs events to the console.

## 16. Error, empty, and loading states (implement all)

**16.1** **404:** "This rug has wandered off." Show search, links to Latest drop, and 4 suggested rugs.

**16.2** **500 / API failure:** a friendly message, a retry button, contact info, and error logging (Workers logs, with no PII).

**16.3** **Product slug not found but the ID exists:** 301 redirect to the current slug.

**16.4** **Loading:** skeletons for cards, facts, and reviews. Spinners only inside buttons. The gallery uses blurred LQIP placeholders from Cloudflare Images `blur` variants.

**16.5** **Empty states:** cart, filters, search, reviews (hide the section), latest drop (waitlist CTA), wishlist ("Tap the heart on any rug to save it here").

**16.6** **Offline or network error on form submit:** keep the user's input and show "Couldn't send — check your connection and try again."

**16.7** **Checkout conflicts:**

- 409 reserved: "Someone's checking out with this rug right now. We'll hold your spot: get notified."
- 409 sold: "Just sold. Here are similar rugs."

**16.8** **Stripe unavailable:** show "Checkout is temporarily unavailable. Text us at [PHONE] to reserve this rug."

**16.9** **No-JS:** core browsing, product pages, and forms (via standard POST to Functions) still work. The cart falls back to a direct "Buy now" form post.

## 17. Mobile-specific behavior

**17.1** A thumb-friendly sticky bottom bar on product pages. The filter drawer has a sticky "Apply" button. Search is full-screen.

**17.2** Swipe gallery with pinch-zoom in the lightbox. Video uses `playsinline`.

**17.3** Tap-to-call and WhatsApp deep link (`https://wa.me/[NUMBER]?text=Hi, I'm interested in rug TR-0042`).

**17.4** iOS safe areas (`env(safe-area-inset-bottom)`). No hover-only interactions. Input font size of 16px or more to prevent iOS zoom.

**17.5** Respect save-data and `prefers-reduced-data` (no hero video, lower image variant).

**17.6** Test on iPhone SE (375), iPhone 15 (393), Pixel 8 (412), and iPad (768/1024) in Playwright device emulation.

## 18. Admin and catalog editing

**18.1** **Phase 1 (simple):** edit `src/data/products.json` in the repo. Claude Code or GitHub edits trigger a rebuild. Add `npm run new-rug` (an interactive CLI that asks each field and appends a validated entry) and `npm run validate-catalog`.

**18.2** **Phase 2 (Airtable, recommended):** an Airtable base "Rug Catalog" whose fields mirror 7.1.

- `scripts/pull-airtable.mjs` fetches records (AIRTABLE_TOKEN, AIRTABLE_BASE_ID), validates them with Zod, and writes `products.json` at build time.
- An Airtable automation or button calls the Cloudflare deploy hook to publish.
- Document the base schema in the README so it can be created by hand.

**18.3** **`/admin` (protected by Cloudflare Access, email allowlist `[CHRIS EMAIL]`; also verify the `Cf-Access-Jwt-Assertion` header in Functions):**

- **Inventory:** list rugs with live status. Buttons: Mark sold / Release reservation / Relist (writes KV + D1 audit log).
- **Orders:** list from D1, with CSV export.
- **Waitlist and leads:** list with CSV export (waitlist, requests, trade applications, notify-me, room photos with R2 signed links).
- **Reviews moderation:** approve or reject, then trigger a rebuild.
- **Rebuild site** button (calls the deploy hook).
- Keep the admin UI plain and functional, and accessible.

**18.4** **Media workflow doc:** how to upload images to Cloudflare Images and videos to Stream (dashboard or a script `npm run upload-media -- ./rug-TR-0042/`), then paste the IDs into the catalog.

**18.5** **Certificate generator:** `npm run certificate -- TR-0042` generates a branded PDF from the product data (rug ID, photo, facts, signature line, QR code linking to the product page) and saves it to `public/certificates/`.

## 19. Legal and compliance notes (implement the placeholders and flag them for Chris to review)

**19.1** FTC Textile Act disclosures (fiber content, country of origin, dealer identity) on product pages and the feed.

**19.2** Sales tax via Stripe Tax. The README must remind Chris to register in his home state and monitor economic nexus.

**19.3** Privacy policy covering analytics, email, and uploads. CAN-SPAM compliant emails (address plus unsubscribe).

**19.4** Accessibility statement with a contact route. Terms of sale covering the returns and authenticity guarantee.

## 20. Build phases (execute in order and stop after each)

- **Phase 0: Scaffold.** Astro, Tailwind, TypeScript, lint and format, and a Vitest/Playwright setup. `wrangler.toml`, `.dev.vars.example`, `_headers`, `_redirects`. D1 migrations (tables: waitlist, trade_applications, requests, notify, room_uploads, reviews, orders, reservations, processed_events, audit_log). README skeleton. **Output:** repo tree, and commands to create D1/KV/R2 and run locally with `wrangler pages dev`.
- **Phase 1: Design system.** Tokens, fonts, base styles, all components from 3.8, and the `/styleguide` page with every state. Contrast unit test. **Stop for my visual review.**
- **Phase 2: Data layer.** Zod schema, 8 realistic placeholder rugs (marked "SAMPLE"), the `rugs-index.json` generator, the search index, and `npm run new-rug` / `validate-catalog`.
- **Phase 3: Layout and navigation.** Header, mega menu, mobile drawer, footer, announcement bar, breadcrumbs, skip link, and the 404/500 pages.
- **Phase 4: Home page.** All sections from Section 5, including `LAUNCH_MODE=waitlist`.
- **Phase 5: Collections, filters, and search.** Everything in Section 6, with URL state and empty states.
- **Phase 6: Product page.** Everything in Section 7, including the gallery, lightbox, sticky bar, and sold/reserved states (using mocked status).
- **Phase 7: Commerce backend.** `/api/status`, `/api/checkout` with the D1 reservation lock, `/api/stripe-webhook`, cart drawer, success/cancel pages, and Stripe Tax. Include a Stripe test-mode walkthrough in the README, plus Playwright tests for the double-purchase race (two parallel checkouts for the same rug: exactly one succeeds).
- **Phase 8: Forms and email.** Every form in Section 11 with Turnstile, validation, D1, admin email, and provider sync. R2 upload with EXIF stripping.
- **Phase 9: Content pages.** About, Authenticity, Care, Trade, Book, FAQ, Shipping & Duties, Returns, Reviews, Legal, Accessibility, Contact, with placeholder copy in the brand voice marked `[EDIT]`.
- **Phase 10: SEO.** Metadata, JSON-LD (Section 14), sitemap, robots, Merchant feed, and validation tests.
- **Phase 11: Analytics.** The `track()` helper, GA4, Pixel, CAPI from Functions, consent config, UTM capture, and debug mode.
- **Phase 12: Admin.** `/admin` behind Cloudflare Access, `pull-airtable.mjs`, the certificate generator, and the media upload script.
- **Phase 13: Hardening.** Accessibility audit fixes, Lighthouse CI budgets, security headers/CSP check, rate limits, error logging, no-JS fallbacks, and cross-device Playwright runs.
- **Phase 14: Deploy.** GitHub → Cloudflare Pages, production secrets via `wrangler pages secret put`, custom domain, Stripe live webhook, smoke test on production, and a launch checklist in the README.

## 21. Acceptance criteria / QA checklist (all must pass before launch)

**Functionality**

- [ ] A rug can be purchased end-to-end in Stripe test mode. Tax is calculated, the order is written to D1, the rug shows "Sold" everywhere within 30 seconds (live status) and after the rebuild.
- [ ] Two simultaneous checkouts for the same rug: exactly one reaches Stripe, and the other gets the 409 message.
- [ ] An abandoned checkout releases the rug after expiry.
- [ ] Prices can't be tampered with from the client.
- [ ] Every filter (size, style, region, color, price, condition, pile type, availability) works, combines correctly, and persists in the URL. The back button restores state.
- [ ] Search finds rugs by title, style, region, color, size, and ID, with typo tolerance.
- [ ] Every form submits, validates, stores to D1, notifies the admin, blocks bots (Turnstile), and shows success and error states.
- [ ] `LAUNCH_MODE=waitlist` hides prices and checkout and promotes the waitlist.
- [ ] Admin is inaccessible without a Cloudflare Access login. Mark sold / Relist / Rebuild work.

**Content and trust**

- [ ] Every product shows fiber content, "Imported from Turkey", the dealer name, duties-included pricing, the flip video, the certificate, and the returns summary.
- [ ] No fake reviews, fake discounts, countdown timers, or "investment" language anywhere.
- [ ] The footer shows the US address, phone, and email on every page.

**Performance**

- [ ] Lighthouse mobile scores of 95+ / 100 / 100 / 100 on Home, a Collection, and a Product page.
- [ ] LCP ≤2.0s, CLS ≤0.05, INP ≤200ms in lab tests on a throttled mobile profile.
- [ ] JS and CSS budgets are met (CI fails otherwise).

**Accessibility**

- [ ] axe finds zero violations on all routes. The full purchase flow can be completed by keyboard only.
- [ ] Focus is visible and never hidden behind sticky elements. Modals trap and restore focus.
- [ ] Videos have captions and transcripts. The hero has a pause control. Reduced motion is respected.
- [ ] Contrast checks pass. The layout reflows at 320px and 400% zoom.

**SEO**

- [ ] Product JSON-LD validates (Product + Offer + shipping + return policy). The sitemap and Merchant feed are valid.
- [ ] Unique titles and descriptions exist on every page. Canonicals are correct. `/admin`, `/api`, and `/checkout` are disallowed.

**Analytics**

- [ ] Every event in 15.3 fires once with the correct parameters (verified in debug mode, GA4 DebugView, and Meta Test Events). Purchase is deduplicated between the browser and CAPI.

**Security**

- [ ] No secrets in the repo. CSP is enforced with no console violations. Webhook signatures are verified. Rate limits are active. Uploads are size- and type-checked, with EXIF removed.

**Devices**

- [ ] Tested at 360/390/412/768/1024/1440/1920 wide, on iOS Safari, Android Chrome, desktop Chrome, Safari, Firefox, and Edge.

## 22. Placeholders Chris must fill

`[BRAND NAME]`, `[DOMAIN]`, `[ADDRESS]` (US), `[PHONE]` / WhatsApp number, `[CHRIS EMAIL]`, `[EMAIL PROVIDER]`, `[Cal.com or Calendly URL]`, returns shipping choice `[CHOOSE]`, social URLs, Stripe/Cloudflare/Meta/GA4 IDs and keys (as secrets only), real rug data and media IDs, certificate signature image, founder photos and videos.
