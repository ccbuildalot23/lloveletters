/** Waitlist, requests, trade applications, notify-me, room uploads (with signed R2 links), contact, returns. CSV export per table. */
import type { Env } from '../../_lib/env';
import { json, error } from '../../_lib/http';
import { toCsv } from '../../_lib/csv';

const TABLES: Record<string, string> = {
  waitlist:
    'SELECT id, email, first_name, interests, source, synced_at, created_at FROM waitlist ORDER BY created_at DESC LIMIT 2000',
  requests: 'SELECT * FROM requests ORDER BY created_at DESC LIMIT 1000',
  trade: 'SELECT * FROM trade_applications ORDER BY created_at DESC LIMIT 1000',
  notify: 'SELECT * FROM notify ORDER BY created_at DESC LIMIT 1000',
  rooms: 'SELECT * FROM room_uploads ORDER BY created_at DESC LIMIT 500',
  contact: 'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 1000',
  returns: 'SELECT * FROM return_requests ORDER BY created_at DESC LIMIT 500',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const table = url.searchParams.get('table') ?? 'waitlist';
  const sql = TABLES[table];
  if (!sql) return error('unknown table');
  const { results } = await env.DB.prepare(sql).all<Record<string, unknown>>();
  if (table === 'rooms')
    for (const r of results)
      r.photo_url = `/api/admin/upload?key=${encodeURIComponent(String(r.r2_key))}`;
  if (url.searchParams.get('format') === 'csv')
    return new Response(toCsv(results), {
      headers: {
        'content-type': 'text/csv',
        'content-disposition': `attachment; filename="${table}.csv"`,
      },
    });
  return json({ ok: true, table, rows: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const b = (await request.json()) as {
    table: string;
    id: number;
    status?: string;
    promo_code?: string;
  };
  if (b.table === 'trade')
    await env.DB.prepare(
      'UPDATE trade_applications SET status = COALESCE(?, status), promo_code = COALESCE(?, promo_code) WHERE id = ?',
    )
      .bind(b.status ?? null, b.promo_code ?? null, b.id)
      .run();
  else if (b.table === 'rooms')
    await env.DB.prepare('UPDATE room_uploads SET status = COALESCE(?, status) WHERE id = ?')
      .bind(b.status ?? null, b.id)
      .run();
  else if (b.table === 'returns')
    await env.DB.prepare('UPDATE return_requests SET status = COALESCE(?, status) WHERE id = ?')
      .bind(b.status ?? null, b.id)
      .run();
  else return error('unsupported');
  await env.DB.prepare('INSERT INTO audit_log (actor, action, details) VALUES (?, ?, ?)')
    .bind((data.user as { email: string }).email, `${b.table}.update`, JSON.stringify(b))
    .run();
  return json({ ok: true });
};
