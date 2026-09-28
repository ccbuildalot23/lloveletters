/** Server-side catalog access: reads the built /rugs-index.json (never trusts the client for prices). */
import type { Env } from './env';

export interface CatalogRug {
  id: string;
  slug: string;
  title: string;
  priceUsd: number;
  status: 'available' | 'reserved' | 'sold';
  image: string;
  imageAlt: string;
  sizeFt: { w: number; l: number };
  style: string;
  region: string;
  sample: boolean;
}

let cache: { at: number; rugs: CatalogRug[] } | null = null;

export async function loadCatalog(env: Env, request: Request): Promise<CatalogRug[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rugs;
  const res = await env.ASSETS.fetch(new URL('/rugs-index.json', request.url));
  if (!res.ok) throw new Error('catalog index unavailable');
  const data = (await res.json()) as { rugs: CatalogRug[] };
  cache = { at: Date.now(), rugs: data.rugs };
  return data.rugs;
}

export const RESERVATION_MS = 30 * 60 * 1000;
export type RugStatus = 'available' | 'reserved' | 'sold';

/** Live status: KV value wins; falls back to the build-time status. */
export async function liveStatus(
  env: Env,
  rugs: CatalogRug[],
  ids: string[],
): Promise<Record<string, RugStatus>> {
  const out: Record<string, RugStatus> = {};
  await Promise.all(
    ids.map(async (id) => {
      const kv = (await env.RUG_STATUS.get(`status:${id}`)) as RugStatus | null;
      out[id] = kv ?? rugs.find((r) => r.id === id)?.status ?? 'available';
    }),
  );
  return out;
}

export async function setStatus(env: Env, id: string, status: RugStatus, ttlSeconds?: number) {
  if (status === 'available') {
    // Explicit "available" clears any KV override so the build-time status applies again,
    // unless the build says sold (relisting is manual in admin and writes 'available' explicitly).
    await env.RUG_STATUS.put(`status:${id}`, 'available');
    return;
  }
  await env.RUG_STATUS.put(
    `status:${id}`,
    status,
    ttlSeconds ? { expirationTtl: Math.max(60, ttlSeconds) } : undefined,
  );
}
