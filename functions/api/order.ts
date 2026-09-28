/** 8.7 GET /api/order?session_id=cs_… → sanitized order summary for the success page. */
import type { Env } from '../_lib/env';
import { json, error } from '../_lib/http';
import { stripeClient } from '../_lib/stripe';
import { loadCatalog } from '../_lib/catalog';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return error('invalid session', 400);
  try {
    const s = await stripeClient(env).checkout.sessions.retrieve(id);
    const rugIds = (s.metadata?.rugIds ?? '').split(',').filter(Boolean);
    const rugs = await loadCatalog(env, request);
    const items = rugIds
      .map((rid) => rugs.find((r) => r.id === rid))
      .filter(Boolean)
      .map((r) => ({
        id: r!.id,
        slug: r!.slug,
        title: r!.title.replace('SAMPLE · ', ''),
        image: r!.image,
        priceUsd: r!.priceUsd,
      }));
    const email = s.customer_details?.email ?? '';
    const masked = email ? email.replace(/^(.).*(@.*)$/, '$1•••$2') : '';
    return json({
      ok: true,
      paid: s.payment_status === 'paid',
      orderId: s.id,
      items,
      subtotal: s.amount_subtotal,
      tax: s.total_details?.amount_tax ?? 0,
      total: s.amount_total,
      email: masked,
      firstName: s.customer_details?.name?.split(' ')[0] ?? '',
    });
  } catch {
    return error('order not found', 404);
  }
};
