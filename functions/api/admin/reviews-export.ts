/** Approved reviews as the JSON shape src/data/reviews.json expects. Pull this in the build (see README "Reviews pipeline"). */
import type { Env } from '../../_lib/env';
import { json } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, rating, title, body, display_name, city, photo_key, verified, rug_id, approved_at FROM reviews WHERE status = ? ORDER BY approved_at DESC',
  )
    .bind('approved')
    .all<Record<string, unknown>>();
  return json(
    results.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title ?? undefined,
      body: r.body,
      displayName: r.display_name,
      city: r.city ?? undefined,
      date: r.approved_at,
      verified: !!r.verified,
      rugId: r.rug_id ?? undefined,
      photo: r.photo_key
        ? `/api/admin/upload?key=${encodeURIComponent(String(r.photo_key))}`
        : undefined,
    })),
  );
};
