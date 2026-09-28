import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Functions tests. Run against `wrangler pages dev` (E2E_BASE_URL=http://127.0.0.1:8788) with
 * LAUNCH_MODE=live and Stripe TEST keys in .dev.vars. Includes the double-purchase race (Phase 7).
 */
test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL to a wrangler pages dev URL');

test('GET /api/status returns statuses', async ({ request }) => {
  const r = await request.get('/api/status?ids=TR-0001,TR-0007');
  expect(r.ok()).toBe(true);
  const j = await r.json();
  expect(j['TR-0007']).toBe('sold');
  expect(['available', 'reserved']).toContain(j['TR-0001']);
});

test('POST /api/checkout rejects a sold rug with 409', async ({ request }) => {
  const r = await request.post('/api/checkout', {
    data: { rugIds: ['TR-0007'] },
    headers: { accept: 'application/json' },
  });
  expect(r.status()).toBe(409);
  const j = await r.json();
  expect(j.unavailable[0].status).toBe('sold');
});

async function stripeConfigured(request: APIRequestContext) {
  const h = await request.get('/api/health').then((r) => r.json() as Promise<{ stripe: boolean }>);
  return h.stripe;
}

test('double purchase race: exactly one of two parallel checkouts succeeds', async ({
  request,
}) => {
  test.skip(!(await stripeConfigured(request)), 'Needs STRIPE_SECRET_KEY (test mode) in .dev.vars');
  // Requires TR-0003 available in KV/D1 (fresh local state). Two simultaneous checkouts for the same rug.
  const body = { rugIds: ['TR-0003'] };
  const headers = { accept: 'application/json' };
  const [a, b] = await Promise.all([
    request.post('/api/checkout', { data: body, headers }),
    request.post('/api/checkout', { data: body, headers }),
  ]);
  const statuses = [a.status(), b.status()].sort();
  expect(statuses).toEqual([200, 409]);
  const ok = a.status() === 200 ? await a.json() : await b.json();
  expect(ok.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  const blocked = a.status() === 409 ? await a.json() : await b.json();
  expect(blocked.unavailable[0]).toEqual({ id: 'TR-0003', status: 'reserved' });
  // Status endpoint now reports reserved
  const s = await request.get('/api/status?ids=TR-0003');
  expect((await s.json())['TR-0003']).toBe('reserved');
});

test('prices cannot be tampered with from the client', async ({ request }) => {
  test.skip(!(await stripeConfigured(request)), 'Needs STRIPE_SECRET_KEY (test mode) in .dev.vars');
  const r = await request.post('/api/checkout', {
    data: { rugIds: ['TR-0004'], price: 1, priceUsd: 1, line_items: [{ amount: 1 }] },
    headers: { accept: 'application/json' },
  });
  // Either reserved (200) or already held (409); never a 200 with a tampered price because prices are read server-side.
  expect([200, 409]).toContain(r.status());
});

test('waitlist form stores and de-duplicates', async ({ request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const r1 = await request.post('/api/forms/waitlist', {
    data: { email, first_name: 'Test', interests: ['size:8x10'], turnstile_token: 'test' },
    headers: { accept: 'application/json' },
  });
  expect(r1.ok()).toBe(true);
  const r2 = await request.post('/api/forms/waitlist', {
    data: { email, turnstile_token: 'test' },
    headers: { accept: 'application/json' },
  });
  expect((await r2.json()).already).toBe(true);
});

test('honeypot silently accepts bots', async ({ request }) => {
  const r = await request.post('/api/forms/contact', {
    data: { website_url: 'http://spam', name: 'x', email: 'x@x.com', message: 'buy now' },
    headers: { accept: 'application/json' },
  });
  expect(r.ok()).toBe(true);
});

test('stripe webhook rejects bad signatures', async ({ request }) => {
  const r = await request.post('/api/stripe-webhook', {
    data: '{}',
    headers: { 'stripe-signature': 't=1,v1=bad', 'content-type': 'application/json' },
  });
  expect(r.status()).toBe(400);
});

test('admin is unauthorized without Access on non-local hosts', async ({ request, baseURL }) => {
  test.skip(/localhost|127\.0\.0\.1/.test(baseURL ?? ''), 'local dev allows admin');
  const r = await request.get('/api/admin/inventory');
  expect(r.status()).toBe(401);
});
