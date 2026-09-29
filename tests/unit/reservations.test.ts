import { describe, expect, it } from 'vitest';
import { reserve, release, attachSession, findBySession } from '../../functions/_lib/reservations';
import { fakeEnv } from './helpers/fake-env';

describe('one-of-one reservation lock (8.5c), offline', () => {
  it('exactly one of two simultaneous buyers reserves the same rug', async () => {
    const { env, kv } = fakeEnv();
    const [a, b] = await Promise.all([
      reserve(env, ['TR-0001'], 'buyer-a'),
      reserve(env, ['TR-0001'], 'buyer-b'),
    ]);
    const winners = [a, b].filter((r) => r.failed.length === 0);
    expect(winners).toHaveLength(1);
    expect([a, b].filter((r) => r.failed.includes('TR-0001'))).toHaveLength(1);
    expect(kv.get('status:TR-0001')).toBe('reserved');
  });

  it('a multi-rug cart never half-reserves: partial failure rolls back the rugs it won', async () => {
    const { env, db, kv } = fakeEnv();
    await reserve(env, ['TR-0002'], 'first');
    const second = await reserve(env, ['TR-0001', 'TR-0002'], 'second');
    expect(second.failed).toEqual(['TR-0002']);
    expect(db.reservations.has('TR-0001')).toBe(false);
    expect(db.reservations.get('TR-0002')?.session_id).toBe('pending:first');
    expect(kv.get('status:TR-0001')).toBeUndefined();
  });

  it('expired holds are purged before reserving, so a stale hold cannot block a buyer', async () => {
    const { env, db } = fakeEnv();
    db.reservations.set('TR-0003', {
      rug_id: 'TR-0003',
      session_id: 'cs_old',
      expires_at: Date.now() - 1,
    });
    const r = await reserve(env, ['TR-0003'], 'fresh');
    expect(r.failed).toEqual([]);
    expect(r.expiresAt).toBeGreaterThan(Date.now());
  });

  it('attachSession then release(onlySession) frees the rug and clears the KV mirror', async () => {
    const { env, db, kv } = fakeEnv();
    await reserve(env, ['TR-0004'], 'tok');
    await attachSession(env, ['TR-0004'], 'tok', 'cs_123');
    expect((await findBySession(env, 'cs_123')).map((r) => r.rug_id)).toEqual(['TR-0004']);
    await release(env, ['TR-0004'], { onlySession: 'cs_other' });
    expect(db.reservations.has('TR-0004')).toBe(true); // wrong session: untouched
    await release(env, ['TR-0004'], { onlySession: 'cs_123' });
    expect(db.reservations.has('TR-0004')).toBe(false);
    expect(kv.get('status:TR-0004')).toBe('available');
  });
});
