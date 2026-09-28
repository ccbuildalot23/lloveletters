/**
 * Reservation lock (8.5c). D1's PRIMARY KEY on reservations.rug_id guarantees that two buyers
 * cannot both reserve the same rug: INSERT OR IGNORE reports changes=1 for exactly one of them.
 */
import type { Env } from './env';
import { RESERVATION_MS, setStatus } from './catalog';

export interface Reservation {
  rug_id: string;
  session_id: string | null;
  expires_at: number;
  token?: string;
}

export async function purgeExpired(env: Env) {
  await env.DB.prepare('DELETE FROM reservations WHERE expires_at < ?').bind(Date.now()).run();
}

/** Tries to reserve every id atomically per row. Returns the ids that could NOT be reserved. */
export async function reserve(
  env: Env,
  ids: string[],
  token: string,
): Promise<{ failed: string[]; expiresAt: number }> {
  await purgeExpired(env);
  const expiresAt = Date.now() + RESERVATION_MS;
  const failed: string[] = [];
  const won: string[] = [];
  for (const id of ids) {
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO reservations (rug_id, session_id, expires_at) VALUES (?, ?, ?)',
    )
      .bind(id, `pending:${token}`, expiresAt)
      .run();
    if (res.meta.changes === 1) won.push(id);
    else failed.push(id);
  }
  if (failed.length && won.length) {
    // Roll back partial holds so a multi-rug cart never half-reserves.
    await env.DB.prepare(
      `DELETE FROM reservations WHERE rug_id IN (${won.map(() => '?').join(',')}) AND session_id = ?`,
    )
      .bind(...won, `pending:${token}`)
      .run();
  } else {
    await Promise.all(won.map((id) => setStatus(env, id, 'reserved', RESERVATION_MS / 1000)));
  }
  return { failed, expiresAt };
}

export async function attachSession(env: Env, ids: string[], token: string, sessionId: string) {
  await env.DB.prepare(
    `UPDATE reservations SET session_id = ? WHERE session_id = ? AND rug_id IN (${ids.map(() => '?').join(',')})`,
  )
    .bind(sessionId, `pending:${token}`, ...ids)
    .run();
}

export async function release(env: Env, ids: string[], opts: { onlySession?: string } = {}) {
  for (const id of ids) {
    if (opts.onlySession)
      await env.DB.prepare('DELETE FROM reservations WHERE rug_id = ? AND session_id = ?')
        .bind(id, opts.onlySession)
        .run();
    else await env.DB.prepare('DELETE FROM reservations WHERE rug_id = ?').bind(id).run();
    const kv = await env.RUG_STATUS.get(`status:${id}`);
    if (kv === 'reserved') await setStatus(env, id, 'available');
  }
}

export async function findBySession(env: Env, sessionId: string): Promise<Reservation[]> {
  const { results } = await env.DB.prepare(
    'SELECT rug_id, session_id, expires_at FROM reservations WHERE session_id = ?',
  )
    .bind(sessionId)
    .all<Reservation>();
  return results;
}

export async function findByToken(env: Env, token: string): Promise<Reservation[]> {
  const { results } = await env.DB.prepare(
    'SELECT rug_id, session_id, expires_at FROM reservations WHERE session_id LIKE ? AND expires_at > ?',
  )
    .bind(`%${token}`, Date.now())
    .all<Reservation>();
  return results;
}
