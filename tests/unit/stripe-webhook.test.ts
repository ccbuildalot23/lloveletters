/**
 * Offline contract tests for the Stripe webhook (8.6). A synthetic signing secret proves the
 * signature path, idempotency and the expired-session release without any Stripe credentials.
 * These do not prove live checkout works: that still needs test keys (see docs/HANDOFF.md).
 */
import Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import { onRequestPost } from '../../functions/api/stripe-webhook';
import { fakeEnv } from './helpers/fake-env';

const SECRET = 'whsec_synthetic_test_secret';
const stripe = new Stripe('sk_test_synthetic', {
  apiVersion: '2026-08-27.basil' as Stripe.LatestApiVersion,
});

function expiredEvent(id: string, sessionId: string, rugIds: string[]) {
  return JSON.stringify({
    id,
    object: 'event',
    type: 'checkout.session.expired',
    data: {
      object: { id: sessionId, object: 'checkout.session', metadata: { rugIds: rugIds.join(',') } },
    },
  });
}

function post(payload: string, signature: string) {
  return new Request('https://example.test/api/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
    body: payload,
  });
}

function call(env: ReturnType<typeof fakeEnv>['env'], req: Request) {
  return onRequestPost({
    request: req,
    env,
    params: {},
    data: {},
    waitUntil: () => {},
    passThroughOnException: () => {},
    next: async () => new Response(),
    functionPath: '/api/stripe-webhook',
  } as unknown as Parameters<typeof onRequestPost>[0]);
}

describe('signature verification (synthetic secret)', () => {
  it('accepts a payload signed with the configured secret', async () => {
    const payload = expiredEvent('evt_ok', 'cs_ok', ['TR-0001']);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const event = await stripe.webhooks.constructEventAsync(
      payload,
      header,
      SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
    expect(event.id).toBe('evt_ok');
  });
  it('rejects a wrong secret, a tampered payload, and a stale timestamp', async () => {
    const payload = expiredEvent('evt_bad', 'cs_bad', ['TR-0001']);
    const provider = Stripe.createSubtleCryptoProvider();
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    await expect(
      stripe.webhooks.constructEventAsync(payload, header, 'whsec_other', undefined, provider),
    ).rejects.toThrow();
    await expect(
      stripe.webhooks.constructEventAsync(
        payload.replace('TR-0001', 'TR-0002'),
        header,
        SECRET,
        undefined,
        provider,
      ),
    ).rejects.toThrow();
    const old = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: SECRET,
      timestamp: Math.floor(Date.now() / 1000) - 3600,
    });
    await expect(
      stripe.webhooks.constructEventAsync(payload, old, SECRET, undefined, provider),
    ).rejects.toThrow();
  });
});

describe('POST /api/stripe-webhook offline', () => {
  it('returns 400 for a missing or invalid signature and touches nothing', async () => {
    const { env, db } = fakeEnv();
    const payload = expiredEvent('evt_1', 'cs_1', ['TR-0001']);
    expect((await call(env, post(payload, 't=1,v1=deadbeef'))).status).toBe(400);
    const noSig = new Request('https://example.test/api/stripe-webhook', {
      method: 'POST',
      body: payload,
    });
    expect((await call(env, noSig)).status).toBe(400);
    expect(db.processed.size).toBe(0);
  });

  it('expired session releases the hold for that session only, and a duplicate delivery is a no-op', async () => {
    const { env, db, kv } = fakeEnv();
    db.reservations.set('TR-0001', {
      rug_id: 'TR-0001',
      session_id: 'cs_exp',
      expires_at: Date.now() + 60_000,
    });
    db.reservations.set('TR-0002', {
      rug_id: 'TR-0002',
      session_id: 'cs_other',
      expires_at: Date.now() + 60_000,
    });
    kv.set('status:TR-0001', 'reserved');
    const payload = expiredEvent('evt_exp', 'cs_exp', ['TR-0001']);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const first = await call(env, post(payload, header));
    expect(first.status).toBe(200);
    expect(db.reservations.has('TR-0001')).toBe(false);
    expect(db.reservations.has('TR-0002')).toBe(true);
    expect(kv.get('status:TR-0001')).toBe('available');

    kv.set('status:TR-0001', 'reserved'); // a new buyer holds it again
    const again = await call(env, post(payload, header));
    expect(await again.json()).toEqual({ ok: true, duplicate: true });
    expect(kv.get('status:TR-0001')).toBe('reserved'); // the replay did not release the new hold
  });

  it('reordered delivery: an expiry for a session that no longer holds the rug does not free it', async () => {
    const { env, db, kv } = fakeEnv();
    db.reservations.set('TR-0005', {
      rug_id: 'TR-0005',
      session_id: 'cs_new',
      expires_at: Date.now() + 60_000,
    });
    kv.set('status:TR-0005', 'reserved');
    const payload = expiredEvent('evt_late', 'cs_stale', ['TR-0005']);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    expect((await call(env, post(payload, header))).status).toBe(200);
    // cs_stale holds nothing any more, so the newer buyer's hold must survive.
    expect(db.reservations.has('TR-0005')).toBe(true);
    expect(kv.get('status:TR-0005')).toBe('reserved');
  });

  it('expiry with no rows repairs a KV "reserved" that no reservation backs', async () => {
    const { env, db, kv } = fakeEnv();
    kv.set('status:TR-0006', 'reserved');
    const payload = expiredEvent('evt_orphan', 'cs_gone', ['TR-0006']);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    expect((await call(env, post(payload, header))).status).toBe(200);
    expect(db.reservations.size).toBe(0);
    expect(kv.get('status:TR-0006')).toBe('available');
  });
});
