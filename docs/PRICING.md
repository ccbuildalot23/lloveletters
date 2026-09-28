# Pricing guidance (from Demand Evidence, Sep 28, 2026)

US buyers do pay $800–$2,500 online for hand-knotted Turkish rugs, clustered at **$1,000–$1,600 for 8×10s**.
The bands in `src/lib/pricing.ts` come from public Shopify feeds (Revival Rugs, Kirmen Rugs) and Etsy shop medians;
they are last-listed prices of sold-out one-of-a-kind rugs, so directional only.

| Size | Condition | Observed sold-out median | Middle 50%   |
| ---- | --------- | ------------------------ | ------------ |
| 5×8  | new       | $1,250                   | $1,140–1,344 |
| 5×8  | vintage   | $357                     | $310–497     |
| 8×10 | new       | $1,561                   | $1,297–2,271 |
| 8×10 | vintage   | $1,384                   | $898–1,998   |
| 9×12 | new       | $2,895                   | $2,634–3,230 |
| 9×12 | vintage   | $2,616                   | $1,942–2,877 |

**What it means for the catalog (estimates from the cost model):**

- Lead with **new 5×8s near $1,250** (works at a wholesale of roughly $350–420) and **9×12s near $2,900** (viable at a ~$950 wholesale).
- **8×10s are the trap**: at $1,600 the breakeven wholesale is about $430. At a $700 wholesale an 8×10 needs about $2,160 to make 10%, which is above the median but inside the upper quartile. Position 8×10s as designer/trade pieces, or cut the ~$600 courier cost by batching freight into US stock.
- **Vintage 5×8s clear at about $350.** That segment is crowded and doesn't cover courier-from-Türkiye costs; treat them as add-ons.
- **DC is a top-3 state** for "turkish rug" / "oushak rug" search interest, and DC searchers skew Oushak. Rugs.net offers next-day local delivery in DC/MD/VA, so a small local stock of best-sellers is worth testing.

`npm run validate-catalog` warns (never fails) when a rug's price sits far outside its band; `npm run new-rug` prints the band as a hint.

**Stagers** are a channel more than a full-price buyer: DC staging firms own their inventory, spend a median of $1,500 per staged home, and rotate rugs every ~5 weeks. Test a stage-to-sell placement (rug in a staged listing with a QR Provenance Report and a buy-it price) and trade pricing on the $350–1,000 vintage tier. See `/trade#stagers`.
