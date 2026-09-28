/** Cart (8.1): rug IDs in localStorage; prices & availability re-validated server-side. */
import { track } from './analytics';
import { getUtmContext } from './utm';

const KEY = 'cart_v1';
export interface IndexRug {
  id: string;
  slug: string;
  title: string;
  priceUsd: number;
  status: string;
  image: string;
  sizeFt: { w: number; l: number };
  sizeCm: { w: number; l: number };
}

export function getCart(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent('cart:change', { detail: ids }));
}
export function addToCart(id: string) {
  const ids = getCart();
  if (!ids.includes(id)) ids.push(id);
  save(ids);
}
export function removeFromCart(id: string) {
  save(getCart().filter((x) => x !== id));
}
export function clearCart() {
  save([]);
}

let indexCache: IndexRug[] | null = null;
export async function loadIndex(): Promise<IndexRug[]> {
  if (indexCache) return indexCache;
  const r = await fetch('/rugs-index.json');
  const data = (await r.json()) as { rugs: IndexRug[] };
  indexCache = data.rugs;
  return indexCache;
}

export async function fetchStatus(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  try {
    const r = await fetch(`/api/status?ids=${encodeURIComponent(ids.join(','))}`, {
      cache: 'no-store',
    });
    if (!r.ok) return {};
    return (await r.json()) as Record<string, string>;
  } catch {
    return {};
  }
}

export type CheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false;
      status: number;
      unavailable?: Array<{ id: string; status: string }>;
      message?: string;
    };

export async function startCheckout(rugIds: string[]): Promise<CheckoutResult> {
  track('begin_checkout', { item_ids: rugIds });
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        rugIds,
        utm: getUtmContext(),
        turnstile_token:
          document.querySelector<HTMLInputElement>('input[name=turnstile_token]')?.value ?? '',
      }),
    });
    const data = (await r.json().catch(() => ({}))) as {
      url?: string;
      unavailable?: Array<{ id: string; status: string }>;
      message?: string;
    };
    if (r.ok && data.url) return { ok: true, url: data.url };
    if (r.status === 409) {
      for (const u of data.unavailable ?? [])
        track('checkout_blocked', { item_id: u.id, status: u.status });
    }
    return { ok: false, status: r.status, unavailable: data.unavailable, message: data.message };
  } catch {
    return { ok: false, status: 0, message: 'network' };
  }
}

export function formatUsd(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}
export function ftIn(ft: number) {
  const w = Math.floor(ft);
  let i = Math.round((ft - w) * 12);
  let f = w;
  if (i === 12) {
    f++;
    i = 0;
  }
  return i ? `${f}′ ${i}″` : `${f}′`;
}
