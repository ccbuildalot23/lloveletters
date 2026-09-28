/** GET: rugs with live status. POST {id, action: sold|release|relist} → KV + D1 audit (18.3). */
import type { Env } from '../../_lib/env';
import { json, error, parseBody } from '../../_lib/http';
import { loadCatalog, liveStatus, setStatus } from '../../_lib/catalog';
import { release } from '../../_lib/reservations';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const rugs = await loadCatalog(env, request);
  const status = await liveStatus(
    env,
    rugs,
    rugs.map((r) => r.id),
  );
  const { results: holds } = await env.DB.prepare(
    'SELECT rug_id, session_id, expires_at FROM reservations WHERE expires_at > ?',
  )
    .bind(Date.now())
    .all<{ rug_id: string; session_id: string; expires_at: number }>();
  return json({
    ok: true,
    rugs: rugs.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      priceUsd: r.priceUsd,
      buildStatus: r.status,
      liveStatus: status[r.id],
      hold: holds.find((h) => h.rug_id === r.id) ?? null,
    })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const body = await parseBody(request);
  const id = String(body.id ?? '').toUpperCase();
  const action = String(body.action ?? '');
  if (!/^TR-\d{4}$/.test(id)) return error('bad id');
  const actor = (data.user as { email: string }).email;
  if (action === 'sold') await setStatus(env, id, 'sold');
  else if (action === 'release') await release(env, [id]);
  else if (action === 'relist') {
    await release(env, [id]);
    await setStatus(env, id, 'available');
  } else return error('bad action');
  await env.DB.prepare('INSERT INTO audit_log (actor, action, rug_id) VALUES (?, ?, ?)')
    .bind(actor, `inventory.${action}`, id)
    .run();
  return json({ ok: true, id, action });
};
