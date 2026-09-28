/**
 * 8.5 POST /api/checkout {rugIds: string[]} → {url} (JSON) or 303 redirect (form post / no-JS).
 * a) Turnstile or rate limit  b) KV status check  c) atomic D1 reservation + KV mirror
 * d) Stripe Checkout Session with server-side prices  e) return session URL
 */
import type Stripe from 'stripe';
import type { Env } from '../_lib/env';
import { json, error, parseBody, clientIp, wantsJson, logError } from '../_lib/http';
import { rateLimited } from '../_lib/ratelimit';
import { verifyTurnstile } from '../_lib/turnstile';
import { loadCatalog, liveStatus, RESERVATION_MS } from '../_lib/catalog';
import { reserve, release, attachSession, findByToken } from '../_lib/reservations';
import { stripeClient } from '../_lib/stripe';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const asJson = wantsJson(request);
  const site = (env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const fail = (message: string, status: number, extra: Record<string, unknown> = {}) =>
    asJson
      ? error(message, status, extra)
      : Response.redirect(`${site}/cart?error=${encodeURIComponent(message)}`, 303);

  if (env.LAUNCH_MODE === 'waitlist')
    return fail('Checkout opens at launch. Join the drop list for early access.', 403);

  const ip = clientIp(request);
  const body = await parseBody(request);
  const rawIds = Array.isArray(body.rugIds)
    ? body.rugIds
    : typeof body.rugIds === 'string'
      ? body.rugIds.split(',')
      : [];
  const rugIds = [
    ...new Set(
      rawIds.map((s) => String(s).trim().toUpperCase()).filter((s) => /^TR-\d{4}$/.test(s)),
    ),
  ].slice(0, 10);
  if (!rugIds.length) return fail('No rugs selected.', 400);

  // a) Turnstile if a token was sent; otherwise rate limit per IP.
  const token = body.turnstile_token;
  if (token) {
    if (!(await verifyTurnstile(env, token, ip, request)))
      return fail('Verification failed. Please try again.', 400);
  } else if (await rateLimited(env, `checkout:${ip}`)) {
    return fail('Too many attempts. Please wait a minute and try again.', 429);
  }

  let rugs;
  try {
    rugs = await loadCatalog(env, request);
  } catch (err) {
    logError('checkout.catalog', err);
    return fail('Checkout is temporarily unavailable.', 503);
  }
  const items = rugIds.map((id) => rugs.find((r) => r.id === id)).filter(Boolean) as typeof rugs;
  if (items.length !== rugIds.length)
    return fail('One of these rugs no longer exists.', 404, {
      unavailable: rugIds
        .filter((id) => !rugs.some((r) => r.id === id))
        .map((id) => ({ id, status: 'sold' })),
    });

  // Resume: same buyer coming back from the cancel page with a valid hold token.
  const resumeToken = typeof body.resume_token === 'string' ? body.resume_token : '';
  if (resumeToken) {
    const held = await findByToken(env, resumeToken);
    const sessionId = held.find((h) => h.session_id && h.session_id.startsWith('cs_'))?.session_id;
    if (
      sessionId &&
      held.length === rugIds.length &&
      held.every((h) => rugIds.includes(h.rug_id))
    ) {
      try {
        const s = await stripeClient(env).checkout.sessions.retrieve(sessionId);
        if (s.status === 'open' && s.url)
          return asJson
            ? json({ ok: true, url: s.url, resumed: true })
            : Response.redirect(s.url, 303);
      } catch {
        /* fall through to a new session */
      }
    }
  }

  // b) Live status
  const status = await liveStatus(env, rugs, rugIds);
  const unavailable = rugIds
    .filter((id) => status[id] !== 'available')
    .map((id) => ({ id, status: status[id] }));
  if (unavailable.length) return fail('Some rugs are no longer available.', 409, { unavailable });

  // c) Atomic reservation
  const holdToken = crypto.randomUUID();
  const { failed, expiresAt } = await reserve(env, rugIds, holdToken);
  if (failed.length) {
    const s2 = await liveStatus(env, rugs, failed);
    return fail('Someone else just reserved one of these rugs.', 409, {
      unavailable: failed.map((id) => ({ id, status: s2[id] === 'sold' ? 'sold' : 'reserved' })),
    });
  }

  // d) Stripe Checkout Session
  try {
    const stripe = stripeClient(env);
    const utm =
      typeof body.utm === 'object' && body.utm ? (body.utm as Record<string, string>) : {};
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((r) => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: r.priceUsd * 100, // server-side price, never from the client
          tax_behavior: 'exclusive',
          product_data: {
            name: r.title.replace('SAMPLE · ', ''),
            description: `Rug ${r.id} · ${ftIn(r.sizeFt.w)} × ${ftIn(r.sizeFt.l)} · ${r.region}. Duties & US shipping included.`,
            images: r.image.startsWith('sample-')
              ? []
              : [`https://imagedelivery.net/${env.CF_IMAGES_HASH ?? ''}/${r.image}/card`],
            metadata: { rugId: r.id },
            tax_code: 'txcd_99999999', // General - Tangible Goods [verify: consider txcd_ for rugs]
          },
        },
      })),
      automatic_tax: { enabled: true },
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free insured shipping, duties included',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
      ],
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      consent_collection: { promotions: 'auto' },
      custom_text: {
        submit: {
          message: 'Every rug is one of one and held for you for 30 minutes while you check out.',
        },
        after_submit: {
          message:
            '30-day returns from delivery. Duties and US shipping are included; nothing is collected at your door.',
        },
      },
      metadata: {
        rugIds: rugIds.join(','),
        holdToken,
        ...Object.fromEntries(
          Object.entries(utm)
            .filter(([k]) => k.startsWith('utm_') || k === 'landing' || k === 'referrer')
            .map(([k, v]) => [k, String(v).slice(0, 200)]),
        ),
      },
      payment_intent_data: {
        metadata: { rugIds: rugIds.join(',') },
        description: `Rug order: ${rugIds.join(', ')}`,
      },
      expires_at: Math.floor(expiresAt / 1000),
      success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/checkout/cancel?hold=${holdToken}&ids=${rugIds.join(',')}&exp=${expiresAt}`,
    } as Stripe.Checkout.SessionCreateParams);
    await attachSession(env, rugIds, holdToken, session.id);
    if (!session.url) throw new Error('no session url');
    return asJson
      ? json({ ok: true, url: session.url, holdToken, expiresAt })
      : Response.redirect(session.url, 303);
  } catch (err) {
    logError('checkout.stripe', err, { rugIds });
    await release(env, rugIds, { onlySession: `pending:${holdToken}` });
    return fail('Checkout is temporarily unavailable. Text us to reserve this rug.', 503);
  }
};

function ftIn(ft: number) {
  const w = Math.floor(ft);
  let i = Math.round((ft - w) * 12);
  let f = w;
  if (i === 12) {
    f++;
    i = 0;
  }
  return i ? `${f}'${i}"` : `${f}'`;
}
export const _RESERVATION_MS = RESERVATION_MS;
