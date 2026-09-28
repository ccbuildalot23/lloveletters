import type { Env } from '../../_lib/env';
import { json } from '../../_lib/http';
import { toCsv } from '../../_lib/csv';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, stripe_session_id, email, name, phone, rug_ids, amount_total, amount_tax, promo_code, is_trade, status, tracking, created_at FROM orders ORDER BY created_at DESC LIMIT 500',
  ).all();
  if (new URL(request.url).searchParams.get('format') === 'csv')
    return new Response(toCsv(results as Record<string, unknown>[]), {
      headers: {
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="orders.csv"',
      },
    });
  return json({ ok: true, orders: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const b = (await request.json()) as { id: number; status?: string; tracking?: string };
  await env.DB.prepare(
    'UPDATE orders SET status = COALESCE(?, status), tracking = COALESCE(?, tracking) WHERE id = ?',
  )
    .bind(b.status ?? null, b.tracking ?? null, b.id)
    .run();
  await env.DB.prepare('INSERT INTO audit_log (actor, action, details) VALUES (?, ?, ?)')
    .bind((data.user as { email: string }).email, 'order.update', JSON.stringify(b))
    .run();
  return json({ ok: true });
};
