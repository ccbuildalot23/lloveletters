/** Review moderation: list pending/approved, approve/reject, then rebuild (18.3). */
import type { Env } from '../../_lib/env';
import { json, error } from '../../_lib/http';
import { triggerDeploy } from '../../_lib/deploy';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const status = new URL(request.url).searchParams.get('status') ?? 'pending';
  const { results } = await env.DB.prepare(
    'SELECT id, rating, title, body, display_name, city, photo_key, status, verified, rug_id, created_at, approved_at FROM reviews WHERE status = ? ORDER BY created_at DESC',
  )
    .bind(status)
    .all();
  return json({ ok: true, reviews: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const b = (await request.json()) as { id: number; action: 'approve' | 'reject' };
  if (!['approve', 'reject'].includes(b.action)) return error('bad action');
  await env.DB.prepare('UPDATE reviews SET status = ?, approved_at = ? WHERE id = ?')
    .bind(
      b.action === 'approve' ? 'approved' : 'rejected',
      b.action === 'approve' ? new Date().toISOString() : null,
      b.id,
    )
    .run();
  await env.DB.prepare('INSERT INTO audit_log (actor, action, details) VALUES (?, ?, ?)')
    .bind((data.user as { email: string }).email, `review.${b.action}`, String(b.id))
    .run();
  const deploy =
    b.action === 'approve' ? await triggerDeploy(env, `review ${b.id} approved`) : 'skipped';
  return json({ ok: true, deploy });
};
