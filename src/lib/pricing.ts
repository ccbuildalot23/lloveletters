/**
 * Observed US market price bands for hand-knotted Turkish rugs, by size bucket and condition.
 * Source: Demand_Evidence (Sep 28, 2026) — sold-out medians and middle-50% ranges from public
 * Shopify feeds (Revival Rugs, Kirmen Rugs) and Etsy shop medians. These are the last-listed
 * prices of sold-out one-of-a-kind rugs, so treat them as directional, not gospel.
 *
 * Used by validate-catalog (warnings, never build failures) and the new-rug CLI (hints).
 * "Verified at the loom" provenance may justify pricing above the band; the ceiling below is a
 * sanity check (1.5× the observed upper quartile), not a rule.
 */
export interface PriceBand {
  median: number;
  q1: number;
  q3: number;
  note: string;
}

export const PRICE_BANDS: Record<
  string,
  Partial<Record<'new' | 'vintage' | 'antique', PriceBand>>
> = {
  '5x8': {
    new: {
      median: 1250,
      q1: 1140,
      q3: 1344,
      note: 'Revival new 5x8 sold-out median $1,250. Works at a ~$350–420 wholesale.',
    },
    vintage: {
      median: 357,
      q1: 310,
      q3: 497,
      note: 'Revival/Kirmen vintage 5x8 clear at ~$350: crowded and too cheap for courier-from-Türkiye economics. Treat as add-ons.',
    },
  },
  '8x10': {
    new: {
      median: 1561,
      q1: 1297,
      q3: 2271,
      note: 'Revival new 8x10 median $1,561; upper quartile $2,271+. Needs ≤$430 wholesale at $1,600, or designer/trade positioning above ~$2,150.',
    },
    vintage: {
      median: 1384,
      q1: 898,
      q3: 1998,
      note: 'Revival vintage 8x10 median $1,384; Kirmen $960.',
    },
  },
  '9x12': {
    new: {
      median: 2895,
      q1: 2634,
      q3: 3230,
      note: 'Revival new 9x12 median $2,895. Viable at a ~$950 wholesale (~12% contribution).',
    },
    vintage: {
      median: 2616,
      q1: 1942,
      q3: 2877,
      note: 'Revival vintage 9x12 median $2,616; Kirmen $1,685.',
    },
  },
};

/** Loose bands for buckets without direct evidence, derived from neighbours. */
const FALLBACK: Record<string, PriceBand> = {
  small: { median: 450, q1: 250, q3: 800, note: 'No direct evidence; small pieces are add-ons.' },
  '4x6': {
    median: 600,
    q1: 350,
    q3: 950,
    note: 'No direct evidence; vintage 4x6 Oushaks list ~$350 on Etsy.',
  },
  '6x9': { median: 1300, q1: 900, q3: 1900, note: 'Interpolated between 5x8 and 8x10.' },
  '10x14+': { median: 3800, q1: 3000, q3: 5000, note: 'Interpolated above 9x12.' },
  runner: { median: 750, q1: 450, q3: 1200, note: 'No direct evidence.' },
};

export function priceBand(
  bucket: string,
  condition: 'new' | 'vintage' | 'antique',
): PriceBand | null {
  const byBucket = PRICE_BANDS[bucket];
  if (byBucket)
    return byBucket[condition] ?? byBucket[condition === 'antique' ? 'vintage' : 'new'] ?? null;
  return FALLBACK[bucket] ?? null;
}

/** Returns a warning string when a price is far outside the observed band, else null. */
export function priceWarning(
  priceUsd: number,
  bucket: string,
  condition: 'new' | 'vintage' | 'antique',
): string | null {
  const band = priceBand(bucket, condition);
  if (!band) return null;
  if (condition === 'antique') return null; // collector pieces are priced individually
  const ceiling = Math.round(band.q3 * 1.5);
  const floor = Math.round(band.q1 * 0.6);
  if (priceUsd > ceiling)
    return `price $${priceUsd} is above 1.5× the observed upper quartile ($${ceiling}) for ${condition} ${bucket}. ${band.note}`;
  if (priceUsd < floor)
    return `price $${priceUsd} is well below the observed band ($${band.q1}–$${band.q3}) for ${condition} ${bucket}; check the unit economics.`;
  return null;
}

/** Observed medians the pricing sheet should be checked against (for the README and CLI). */
export const HEADLINE =
  'Lead with new 5×8s near $1,250 and 9×12s near $2,900; treat 8×10s as designer pieces above ~$2,150 unless wholesale is ≤$430.';
