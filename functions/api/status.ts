/** 8.9 GET /api/status?ids=TR-0001,TR-0002 → {id: status}. Edge-cached 10s. */
import type { Env } from '../_lib/env';
import { json, error } from '../_lib/http';
import { loadCatalog, liveStatus } from '../_lib/catalog';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const ids = (url.searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^TR-\d{4}$/.test(s))
    .slice(0, 100);
  if (!ids.length) return error('ids required', 400);
  const rugs = await loadCatalog(env, request);
  const status = await liveStatus(env, rugs, ids);
  return json(status, 200, { 'cache-control': 'public, max-age=10, s-maxage=10' });
};
