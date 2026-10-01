/**
 * Security headers for Function-generated responses. Cloudflare Pages applies `public/_headers`
 * to static assets only, so anything a Function returns (JSON, redirects, guarded admin pages)
 * must set these itself. Keep the CSP identical to the global rule in public/_headers;
 * tests/unit/headers.test.ts fails if the two drift.
 */
export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com; object-src 'none'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://imagedelivery.net https://images.unsplash.com https://*.cloudflarestream.com https://www.facebook.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; media-src 'self' blob: https://*.cloudflarestream.com; connect-src 'self' https://api.stripe.com https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://*.cloudflarestream.com https://challenges.cloudflare.com; frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://*.cloudflarestream.com https://cal.com https://app.cal.com https://calendly.com; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests";

export const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")',
  'cross-origin-opener-policy': 'same-origin-allow-popups',
  'content-security-policy': CONTENT_SECURITY_POLICY,
};

/** Adds every security header that the response does not already carry. */
export function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
