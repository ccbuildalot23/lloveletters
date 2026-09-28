/** Meta Conversions API (15.1). event_id deduplicates against the browser Pixel. */
import type { Env } from './env';
import { logError } from './http';

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(s.trim().toLowerCase()),
  );
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CapiEvent {
  name: 'Purchase' | 'Lead' | 'InitiateCheckout' | 'Schedule';
  eventId: string;
  email?: string | null;
  phone?: string | null;
  ip?: string;
  ua?: string;
  sourceUrl?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  custom?: Record<string, unknown>;
}

export async function sendCapi(env: Env, ev: CapiEvent): Promise<void> {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return;
  const user_data: Record<string, unknown> = {};
  if (ev.email) user_data.em = [await sha256(ev.email)];
  if (ev.phone) user_data.ph = [await sha256(ev.phone.replace(/\D/g, ''))];
  if (ev.ip) user_data.client_ip_address = ev.ip;
  if (ev.ua) user_data.client_user_agent = ev.ua;
  const body = {
    data: [
      {
        event_name: ev.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: 'website',
        event_source_url: ev.sourceUrl,
        user_data,
        custom_data: {
          currency: ev.currency ?? 'USD',
          value: ev.value,
          content_ids: ev.contentIds,
          content_type: 'product',
          ...ev.custom,
        },
      },
    ],
  };
  try {
    const r = await fetch(
      `https://graph.facebook.com/v21.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!r.ok) throw new Error(`capi ${r.status}`);
  } catch (err) {
    logError('capi', err, { event: ev.name });
  }
}
