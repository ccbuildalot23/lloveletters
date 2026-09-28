/** 16.3: /rugs/TR-0042 → 301 to the current slug (looked up from the built index). */
import type { Env } from '../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const raw = String(params.slug ?? '');
  const m = raw.match(/^tr-?(\d{1,4})$/i);
  if (!m) return env.ASSETS.fetch(request);
  const id = `TR-${m[1]!.padStart(4, '0')}`;
  const idx = await env.ASSETS.fetch(new URL('/rugs-index.json', request.url));
  if (idx.ok) {
    const data = (await idx.json()) as { rugs: Array<{ id: string; slug: string }> };
    const hit = data.rugs.find((r) => r.id === id);
    if (hit) return Response.redirect(new URL(`/rugs/${hit.slug}`, request.url).toString(), 301);
  }
  return env.ASSETS.fetch(new URL('/404', request.url));
};
