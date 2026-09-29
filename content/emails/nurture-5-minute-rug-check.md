# Nurture sequence: after the 5-Minute Rug Check download (7 emails)

**Status: not active.** Nothing is loaded into Kit. Trigger: the `lead:rug-check` tag is added when the lead magnet form is submitted (form and page not built yet; see `content/lead-magnet-5-minute-rug-check.md`). After email 7 the contact moves to the weekly "New from the loom" drop broadcast, which goes only when rugs are actually live.

Every email carries the direct CTA even when the focus is educational. Send cadence is every 3 to 4 days. Exit rules: `customer` tag, unsubscribe, or the contact entering the welcome sequence first (see `docs/EMAIL.md`; a contact never runs both sequences at once). Every email ends with `{{ unsubscribe_link }} · {{ postal_address }}`.

Link placeholders: `{{ site_url }}` is the production origin. The "See a Provenance Report" link goes to a real rug's page once one exists; until then it goes to `/authenticity`.

Designer branch: if the download form's "I'm a designer or stager" box is ticked, add the `trade` tag and swap emails 4 to 7 for the trade versions at the end of this file.

| #   | Day | Job                     | Subject                           | CTA                           |
| --- | --- | ----------------------- | --------------------------------- | ----------------------------- |
| 1   | 0   | Deliver the asset       | Your 5-Minute Rug Check           | Download the checklist        |
| 2   | 3   | Problem and solution    | The rug-shop script, explained    | See a Provenance Report       |
| 3   | 6   | Show the proof          | What the back of a rug tells you  | Shop the rugs                 |
| 4   | 10  | Story (no testimonials) | Why I flip every rug              | Shop the rugs                 |
| 5   | 14  | Top objection           | Buying a rug you can't touch      | Book a live video look        |
| 6   | 18  | Paradigm shift          | You don't need to be a rug expert | Shop the rugs                 |
| 7   | 22  | Direct close            | Ready for your rug?               | Shop the rugs (single button) |

---

## Email 1 · Day 0 · Your 5-Minute Rug Check

- **Preview text:** The checklist, plus the one test I'd do first.

Hi {{ first_name | default: "there" }},

Here's the checklist: {{ site_url }}/rug-check/checklist.pdf `[VERIFY: file exists before activation]`

I made it because most people buying a handmade rug have no way to check anything, and the whole rug-shop routine depends on that.

If you only do one thing, do the first check. Turn the rug over. A hand-knotted back shows the pattern as sharply as the front, knot by knot. Everything else follows from that.

Over the next few weeks I'll send a short note on each of the six checks, with a real rug when I can.

Chris

P.S. Every rug on the site already has these checks done and filmed: {{ site_url }}/rugs

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 2 · Day 3 · The rug-shop script, explained

- **Preview text:** It works because the buyer can't check anything.

Hi {{ first_name | default: "there" }},

You've probably seen it. The rug with a $5,000 tag. The "today only, for you" price. The certificate printed that morning.

That's the script. It works because a buyer can't check anything.

So I flipped it. Every rug I sell comes with a Provenance Report. The back. The knots. The wool. Where it was made.

You check first. Then you decide.

See a Provenance Report: {{ site_url }}/authenticity `[swap for a real rug's page once one is live]`

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 3 · Day 6 · What the back of a rug tells you

- **Preview text:** One rug, section by section.

Hi {{ first_name | default: "there" }},

Let me walk you through one rug's Provenance Report the way I'd do it in person. `[VERIFY: use a real rug from the catalog; until then this email does not send]`

**The flip video.** The back of {{ rug_id }}, filmed in one take. You can see every knot as a small square and the pattern reading as clearly as the front.

**The knot count.** A one-inch square on the back, counted across and down on camera. The number on the page is the number you watched me count.

**Fiber and dye notes.** What the pile is, what the foundation is, and whether the dyes are natural, synthetic or mixed. I write "mixed" when it's mixed.

**The certificate.** Signed, with the rug's ID, size, fibers, region and age. It matches the page you bought it from.

That's the whole report. It's the six checks from your checklist, done for you.

Shop the rugs: {{ site_url }}/rugs

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 4 · Day 10 · Why I flip every rug

- **Preview text:** The short version of how this started.

Hi {{ first_name | default: "there" }},

`[VERIFY: this email uses Chris's true founder story. The draft below is a placeholder shape, not a claim. Do not send until Chris has written or approved the real version. No invented customer stories.]`

I watched how people get treated buying rugs, and I thought there had to be a straight way to do it.

So I go to the workshops myself. I film the back of every rug, count the knots on camera, write down exactly what it is, and put one price on it. No haggling, no markdowns that were never real.

When reviews from real buyers exist, this email becomes their story instead of mine.

Shop the rugs: {{ site_url }}/rugs

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 5 · Day 14 · Buying a rug you can't touch

- **Preview text:** Nerve-racking. I get it. Here's the plan.

Hi {{ first_name | default: "there" }},

Buying a rug you can't touch is nerve-racking. I get it. So here is exactly how it works.

1. **See the proof.** The back, the knots, the fiber, the dye, and where it was made, all on the rug's page.
2. **Order at one honest price.** The price you see is the price. Duties and US shipping are included.
3. **Live with it at home.** Thirty days to decide. If it isn't what the report says, it comes back.

And if you'd rather see a rug move in real light before you decide, book a live video look. Fifteen minutes, my phone, your questions.

Book a live video look: {{ site_url }}/book

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 6 · Day 18 · You don't need to be a rug expert

- **Preview text:** Proof should be normal.

Hi {{ first_name | default: "there" }},

You shouldn't have to be a rug expert to buy an honest rug.

The old way asks you to trust the seller. Trust the story, trust the tag, trust the certificate you can't check. The better way is simpler: check the rug. Look at the back. Count the knots. Read the fiber. Ask where it was made and who says so.

That's what the checklist is for, wherever you buy. And it's what every page on my site does for you before you spend a dollar.

Shop the rugs: {{ site_url }}/rugs

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Email 7 · Day 22 · Ready for your rug?

- **Preview text:** If you're tired of guessing.

Hi {{ first_name | default: "there" }},

If you're tired of guessing, a Provenant rug is the right call. You see the back, the knots and where it was made before you buy. You pay one price. You get thirty days at home.

Want to see this week's rugs?

Shop the rugs: {{ site_url }}/rugs

Chris

{{ unsubscribe_link }} · {{ postal_address }}

---

## Designer branch (replaces emails 4 to 7 when tagged `trade`)

- **4 · Day 10 · The shortlist.** "Tell me the room, the size and the palette. I'll send a short video list from what's in stock and what's on the looms, with the knot close-ups." CTA: Reply with your room. `[VERIFY: shortlist turnaround before promising a time]`
- **5 · Day 14 · The client-ready report.** Each rug's Provenance Report can go straight to your client: flip video, knot count, fiber, dye, certificate. CTA: See a Provenance Report.
- **6 · Day 18 · Trade terms.** Trade pricing is {{ trade_discount }}% off the listed price (from `site.tradeDiscountPct`, currently 15) for approved accounts; memo terms by arrangement. No games. CTA: Apply for trade. `[VERIFY: final trade discount]`
- **7 · Day 22 · Apply.** One-of-one rugs, proof you can hand over, one price. CTA: Apply for trade, {{ site_url }}/trade.

Stagers: no rental program exists. Do not mention rentals in any email until `docs/DECISIONS.md` (stager pilot) is decided. `[VERIFY]`

---

Copy guard: PASS with conditions. No testimonials, statistics or partner claims. Policy statements (one fixed price, duties and US shipping included, 30-day returns) match the site's policy pages. Emails 1, 3 and 4 carry `[VERIFY]` blockers and do not activate until resolved. The villain is described as a pattern; no seller, nationality or company is named.
