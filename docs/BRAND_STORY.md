# Brand story (StoryBrand SB7)

Source: `Brand_Story_StoryBrand_Draft.docx` v0.3 (Chris, Sep 29, 2026), cleaned into the repo's conventions. This file is the spine of the marketing plan: every caption, email, outreach line and homepage section should be traceable to one of the beats below. Customer-facing copy is in Chris's voice: first person, plain, lightly irreverent about the rug-shop script, no em dashes, no hashtags, no emojis.

`[VERIFY]` marks a claim that is not yet true or not yet confirmed. A `[VERIFY]` line never ships in customer copy. The supplier-specific maker story lives in `docs/MAKER_STORY.md` and is swappable; nothing in this file names a supplier.

## Controlling idea

Provenant Rugs sells handmade Turkish rugs that come with their provenance, so buyers know exactly what is on their floor.

Grunt test: What do you offer? Real handmade Turkish rugs. How does it make my life better? I know it's real, no getting taken. How do I buy? Pick a rug and order it online.

## The BrandScript

### Character

Primary hero: a US homeowner, usually in DC, Maryland or Virginia (the DMV is the home market; the business is based in Washington, DC and ships anywhere in the US), furnishing a living or dining room and ready to spend roughly $1,000 to $1,600. The 8x10 is the size they reach for most. Secondary heroes, same story: interior designers (a one-of-one rug they can put in front of a client without a surprise) and home stagers (rugs that make a listing photograph finished; they may prefer to rent `[VERIFY: rental program]`).

The one want: a real handmade Turkish rug they can buy online with total confidence. Style, color, room fit, delivery speed and trade pricing are subplots.

### Problem

**The villain: the rug-shop script.** The sales ritual that makes buying a handmade rug feel like a con: the inflated list price and the "special price, just for you", tufted or machine-made rugs sold as hand-knotted, rugs from somewhere else sold as Turkish, "silk" that turns out to be art silk, certificates nobody can check. It lives in tourist bazaars and it has moved online.

**Guardrail.** The villain is the script. It is never Turkish people, Turkish sellers as a group, or any named company or marketplace. Turkish weavers are on the hero's side. No "tourist trap" or "bazaar" jokes; describe the move, not the person making it.

| Level         | In the customer's words                                                                                    | Use                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| External      | "I can't tell from a screen whether this rug is really hand-knotted, really Turkish, and worth the price." | The tangible barrier                        |
| Internal      | "I'm afraid of getting fooled and feeling like a sucker every time I look at it."                          | The lead emotional message; people buy this |
| Philosophical | "You shouldn't have to be a rug expert to buy an honest rug."                                              | The cause: proof should be standard         |

The obligatory scene that resolves all three: the rug arrives and it matches its Provenance Report.

### Guide

Empathy lines (use one at a time):

- "Nobody wants to wonder if they got taken."
- "Buying a rug you can't touch is nerve-racking. I get it."
- "Like you, I'm tired of the 'special price, just for you' routine."

Competency, what can be claimed today:

| Proof type           | Status                                                         | Use now                                                                                            |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| The system           | Designed, running on the site as the per-rug Provenance Report | Flip video, knot count on camera, fiber and dye notes, signed certificate, all on the product page |
| Testimonials         | None yet                                                       | Hidden until three real ones exist `[VERIFY: never invent]`                                        |
| Statistics           | None yet                                                       | Later: "[X] rugs verified", "[X]% kept" `[VERIFY]`                                                 |
| Awards, press, logos | None                                                           | Leave out until real; logos only with written permission `[VERIFY]`                                |
| Founder background   | "An experienced online seller"                                 | `[VERIFY wording with Chris]`                                                                      |

Guide backstory: tell only the parts that show care and competency. Draft: "I watched how people get treated buying rugs, and I thought there had to be a straight way to do it." `[VERIFY: replace with Chris's true reason. Do not claim he was personally ripped off unless he was.]` Note: the sample founder video transcript in `src/components/home/MeetChris.astro` is marked `[EDIT]` and says a shop tried the script on Chris; it must be replaced with the true story before launch.

### Plan

Process plan, "Three steps to a rug you can trust":

1. **See the proof.** Every rug has its own Provenance Report: the back of the rug, the knots up close, the fiber, the dye, and where it was made.
2. **Order at one honest price.** No haggling, no fake markdowns. Duties and US shipping are included (site policy, `/shipping-duties`).
3. **Live with it at home.** It ships to your door. Thirty days to decide (site policy, `site.returnsDays`; who pays return freight is still `[CHOOSE]` in `src/lib/site.ts`).

A/B alternates for step names: "Look. Order. Live with it." or "Check it. Buy it. Keep it."

Agreement plan, "The Provenant Promise" (FAQ, product page, packing insert):

| Customer fear                   | Commitment                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| "It's machine-made or tufted."  | Hand-knotted means hand-knotted. You see the back of your exact rug before you buy.                                            |
| "It isn't really Turkish."      | Made in Turkey, with a certificate for that rug, or we don't sell it. `[VERIFY: certificate issuer and format]`                |
| "The price is inflated."        | One price. No haggling. No "was $5,000" markdowns.                                                                             |
| "It's 'silk' but isn't."        | We say silk only when it is silk. Catalog rule: the word appears only when the fiber record says silk. `[VERIFY: test method]` |
| "The color won't match."        | Daylight photos and an honest color note on every rug.                                                                         |
| "I'm stuck if I don't like it." | A plain return policy, one paragraph, 30 days (`/returns`).                                                                    |
| "Surprise fees at the door."    | Duties included in the price (`/shipping-duties`).                                                                             |

### Calls to action

| CTA                                 | Type                | Where it lives                                                                                       |
| ----------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| Shop the rugs / Shop the collection | Direct              | Header button and hero when `LAUNCH_MODE=live`; `/rugs`                                              |
| Buy this rug / Buy now              | Direct              | Product page sticky bar                                                                              |
| Join the drop list                  | Direct (pre-launch) | Hero and `#waitlist` while `LAUNCH_MODE=waitlist`                                                    |
| Apply for trade                     | Direct (trade)      | `/trade`; "Ask about staging rentals" only once a program exists `[VERIFY]`                          |
| Get the free 5-Minute Rug Check     | Transitional        | `content/lead-magnet-5-minute-rug-check.md`; page not built, links go to `/authenticity` until it is |
| Book a live video look              | Transitional        | `/book`                                                                                              |

Rule: "Learn more" is not a call to action. Every page gets one obvious button.

### Failure (use sparingly)

Paying handmade prices for a machine-made or tufted rug. A "Turkish" rug made somewhere else. Colors that look nothing like the photos. A return fight over a 60-pound box. Second-guessing it every time you walk across it.

### Success

A real handmade Turkish rug under the table, and a room that finally feels finished. You know where it was made, how, and what it is made of. When a guest asks, you have the story and the proof. You paid a fair price and you know it.

Transformation: from anxious shopper guessing at a screen to the person who knows exactly what's on their floor. Designers: from risk-taker to the designer whose sourcing never gets questioned.

## One-liners and taglines

Written (recommended): "Buying a handmade rug online usually means trusting a story you can't check. Provenant Rugs sells real Turkish rugs, each with a Provenance Report that shows how and where it was made. So you know exactly what's on your floor."

Trade version: "Designers can't afford a rug that turns out to be something else. Provenant Rugs gives you one-of-one Turkish rugs with a Provenance Report you can hand straight to your client. Your sourcing never gets questioned."

Spoken: "It's called Provenant Rugs. Turkish rugs with provenance. You see the back, the knots, and where it was made before you buy."

Taglines: **Verified at the Loom** (primary; the site h1 uses sentence case "Verified at the loom" and stays that way). Alternates: Every rug has a provenance. Turkish rugs, with provenance. Know where your rug comes from. Proof, not promises. Handmade in Turkey. Proven here.

## Where each beat lives

| Beat                  | Site                                                             | Content                                                                         |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Offer + identity      | Hero (`src/components/home/Hero.astro`)                          | Bios (`content/bios.md`)                                                        |
| Stakes                | `Stakes.astro` ("Stop guessing.")                                | Pillar B "Script" posts (`content/calendar-30-day.md`)                          |
| Guide                 | `MeetChris.astro`                                                | Nurture email 4, outreach soundbites                                            |
| Plan                  | `VerifySteps.astro` (three steps)                                | Pillar A rug stories, nurture emails 3 and 5                                    |
| Agreement plan        | `/faq`, product page trust items, `/returns`, `/shipping-duties` | Pillar D "Promise" posts, welcome email 1                                       |
| Direct CTA            | Header, hero, product sticky bar, `WaysToBuy.astro`              | Every caption's CTA line                                                        |
| Transitional CTA      | `WaysToBuy.astro` footer line, `/book`                           | Lead magnet + nurture sequence (`content/emails/nurture-5-minute-rug-check.md`) |
| Explanatory paragraph | `Stakes.astro` closer + `VerifySteps` intro                      | YouTube description, Pinterest about                                            |
| Success               | `InRealHomes.astro`                                              | Pillar C DMV rooms (DC, Maryland, Virginia)                                     |

Homepage order (StoryBrand): Hero → trust bar → Stakes → latest drop → three steps → guide (Meet Chris) → ways to buy → shop by size → shop by style → in real homes → reviews (hidden until real) → trade → drop list. The wireframe's video block is the hero Stream loop and the founder video in Meet Chris; no third video.

## Open items (from the draft, kept verbatim in spirit)

1. Attorney clearance on "Provenant Rugs" before filing (see `docs/DECISIONS.md`). "Provenance Report" is descriptive; treat it as a feature name, not a mark.
2. Confirm the Verified at the Loom protocol with the supplier: who films, which checks, certificate format. `[VERIFY]`
3. Final policies: return freight (`site.returnShipping` is a `[CHOOSE]` placeholder), trade discount (site says 15%), staging rental terms (no program exists). `[VERIFY]`
4. Final price bands (Demand Evidence flags 8x10 margin risk at current shipping cost). `[VERIFY]`
5. Chris's true founder story for the guide backstory and the founder video. `[VERIFY]`
6. Testimonials, statistics, logos: none exist; blocks stay hidden. `[VERIFY]`
7. The book chapters after Chapter 8 were not in the transcript the draft used; one-liner, wireframe, lead generator and nurture structure follow the published framework. `[VERIFY against the book if needed]`

## Copy guard review

PASS with conditions. Customer-facing lines in this file state only what the site already does (flip video, knot count, fiber and dye notes, signed certificate, one fixed price, duties and US shipping included, 30-day returns). Every future proof point carries `[VERIFY]`. The villain is described as a pattern; no people, nationality, seller group or company is named. No numbers beyond the hero's budget band, which describes the customer, not the product.
