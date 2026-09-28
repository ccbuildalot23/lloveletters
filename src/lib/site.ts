/**
 * Site configuration. Values come from PUBLIC_* environment variables at build time
 * (set them in the Cloudflare Pages build environment AND in wrangler.toml [vars] for
 * Functions). Defaults are placeholders — replace everything in [BRACKETS].
 */
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;

export const site = {
  name: env.PUBLIC_BRAND_NAME || 'Loom Letters', // [BRAND NAME]
  dealerName: env.PUBLIC_DEALER_NAME || 'Loom Letters LLC', // [DEALER NAME]
  url: (env.PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, ''), // [DOMAIN]
  tagline: 'Real Turkish rugs. Verified at the loom.',
  description:
    'One-of-a-kind, hand-knotted Turkish rugs sourced and filmed at the source by Chris. Fixed honest prices, duties and US shipping included, 30-day returns.',
  founder: 'Chris',
  phone: env.PUBLIC_PHONE || '+1 (202) 555-0100', // [PHONE]
  whatsapp: env.PUBLIC_WHATSAPP || '12025550100', // [WHATSAPP NUMBER] digits only
  email: env.PUBLIC_EMAIL || 'hello@example.com', // [CHRIS EMAIL]
  address: env.PUBLIC_ADDRESS || '1234 Placeholder Ave NW, Suite 100, Washington, DC 20001', // [ADDRESS]
  bookingUrl: env.PUBLIC_BOOKING_URL || 'https://cal.com/placeholder/live-look', // [Cal.com or Calendly URL]
  googleReviewUrl: env.PUBLIC_GOOGLE_REVIEW_URL || 'https://g.page/r/placeholder/review',
  social: {
    instagram: env.PUBLIC_INSTAGRAM || 'https://instagram.com/placeholder',
    tiktok: env.PUBLIC_TIKTOK || 'https://tiktok.com/@placeholder',
    pinterest: env.PUBLIC_PINTEREST || 'https://pinterest.com/placeholder',
    youtube: env.PUBLIC_YOUTUBE || 'https://youtube.com/@placeholder',
  },
  launchMode: (env.LAUNCH_MODE || env.PUBLIC_LAUNCH_MODE || 'waitlist') as 'waitlist' | 'live',
  soldIndexDays: Number(env.SOLD_INDEX_DAYS || 90),
  cfImagesHash: env.CF_IMAGES_HASH || env.PUBLIC_CF_IMAGES_HASH || 'PLACEHOLDER_HASH',
  turnstileSiteKey: env.PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA', // Cloudflare test key (always passes)
  ga4Id: env.PUBLIC_GA4_ID || env.GA4_ID || '',
  metaPixelId: env.PUBLIC_META_PIXEL_ID || env.META_PIXEL_ID || '',
  cfBeaconToken: env.PUBLIC_CF_BEACON_TOKEN || '',
  bnplEnabled: (env.PUBLIC_BNPL_ENABLED || 'false') === 'true',
  returnsDays: 30,
  returnShipping: '[CHOOSE: prepaid label deducted / free]',
  tradeDiscountPct: 15,
} as const;

export const isWaitlistMode = site.launchMode === 'waitlist';

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const telLink = `tel:${site.phone.replace(/[^\d+]/g, '')}`;
