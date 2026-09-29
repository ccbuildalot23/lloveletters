/** 8.6 POST /api/stripe-webhook — signature verified, idempotent via processed_events. */
import type Stripe from 'stripe';
import type { Env } from '../_lib/env';
import { json, error, logError } from '../_lib/http';
import { stripeClient, webhookCrypto } from '../_lib/stripe';
import { setStatus } from '../_lib/catalog';
import { release, findBySession, isHeld } from '../_lib/reservations';
import { sendCapi } from '../_lib/capi';
import { notifyAdmin, syncSubscriber } from '../_lib/email';
import { triggerDeploy } from '../_lib/deploy';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig) return error('missing signature', 400);
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripeClient(env).webhooks.constructEventAsync(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      webhookCrypto(),
    );
  } catch (err) {
    logError('webhook.signature', err);
    return error('invalid signature', 400);
  }

  // Idempotency
  const seen = await env.DB.prepare(
    'INSERT OR IGNORE INTO processed_events (event_id, type) VALUES (?, ?)',
  )
    .bind(event.id, event.type)
    .run();
  if (seen.meta.changes === 0) return json({ ok: true, duplicate: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCompleted(env, event.data.object as Stripe.Checkout.Session, request);
        break;
      case 'checkout.session.expired':
        await onExpired(env, event.data.object as Stripe.Checkout.Session);
        break;
      case 'charge.refunded':
        await onRefunded(env, event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (err) {
    logError('webhook.handler', err, { type: event.type });
    // Let Stripe retry: remove the idempotency marker.
    await env.DB.prepare('DELETE FROM processed_events WHERE event_id = ?').bind(event.id).run();
    return error('handler failed', 500);
  }
  return json({ ok: true });
};

function idsFrom(session: Stripe.Checkout.Session): string[] {
  return (session.metadata?.rugIds ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function onCompleted(env: Env, session: Stripe.Checkout.Session, request: Request) {
  const rugIds = idsFrom(session);
  const stripe = stripeClient(env);
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['total_details.breakdown'],
  });
  const promo = full.total_details?.breakdown?.discounts?.[0]?.discount?.promotion_code;
  const promoCode =
    typeof promo === 'string' ? promo : ((promo as Stripe.PromotionCode | null)?.code ?? null);
  const isTrade =
    !!promoCode &&
    (!!env.TRADE_PROMO_CODE ? promoCode === env.TRADE_PROMO_CODE : /trade/i.test(promoCode));
  const consent = full.consent?.promotions === 'opt_in';
  const email = full.customer_details?.email ?? null;
  const utm = Object.fromEntries(
    Object.entries(full.metadata ?? {}).filter(
      ([k]) => k.startsWith('utm_') || k === 'landing' || k === 'referrer',
    ),
  );

  // Mark sold (no TTL) and release holds
  for (const id of rugIds) await setStatus(env, id, 'sold');
  await env.DB.prepare(
    `DELETE FROM reservations WHERE rug_id IN (${rugIds.map(() => '?').join(',')})`,
  )
    .bind(...rugIds)
    .run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO orders (stripe_session_id, stripe_payment_intent, email, name, phone, rug_ids, amount_subtotal, amount_tax, amount_total, currency, promo_code, is_trade, shipping_address, utm, marketing_consent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      full.id,
      typeof full.payment_intent === 'string'
        ? full.payment_intent
        : (full.payment_intent?.id ?? null),
      email,
      full.customer_details?.name ?? null,
      full.customer_details?.phone ?? null,
      JSON.stringify(rugIds),
      full.amount_subtotal ?? null,
      full.total_details?.amount_tax ?? null,
      full.amount_total ?? null,
      full.currency ?? 'usd',
      promoCode,
      isTrade ? 1 : 0,
      JSON.stringify(
        (
          full as unknown as {
            shipping_details?: unknown;
            collected_information?: { shipping_details?: unknown };
          }
        ).collected_information?.shipping_details ??
          (full as unknown as { shipping_details?: unknown }).shipping_details ??
          null,
      ),
      JSON.stringify(utm),
      consent ? 1 : 0,
    )
    .run();

  await sendCapi(env, {
    name: 'Purchase',
    eventId: full.id,
    email,
    phone: full.customer_details?.phone,
    value: (full.amount_total ?? 0) / 100,
    contentIds: rugIds,
    sourceUrl: `${env.PUBLIC_SITE_URL}/checkout/success`,
    custom: { num_items: rugIds.length },
  });
  if (consent && email)
    await syncSubscriber(env, {
      email,
      firstName: full.customer_details?.name?.split(' ')[0],
      tags: ['customer', ...rugIds.map((id) => `bought:${id}`)],
      source: 'checkout',
    });
  await notifyAdmin(
    env,
    `New order: ${rugIds.join(', ')} ($${((full.amount_total ?? 0) / 100).toFixed(2)})`,
    `Order ${full.id}\nRugs: ${rugIds.join(', ')}\nTotal: $${((full.amount_total ?? 0) / 100).toFixed(2)} (tax $${((full.total_details?.amount_tax ?? 0) / 100).toFixed(2)})\nTrade: ${isTrade ? 'yes' : 'no'}${promoCode ? ` (${promoCode})` : ''}\nView in Stripe: https://dashboard.stripe.com/payments/${typeof full.payment_intent === 'string' ? full.payment_intent : ''}\nAdmin: ${env.PUBLIC_SITE_URL}/admin/orders`,
  );
  await triggerDeploy(env, `order ${full.id}`);
  void request;
}

async function onExpired(env: Env, session: Stripe.Checkout.Session) {
  const held = await findBySession(env, session.id);
  if (held.length) {
    await release(
      env,
      held.map((h) => h.rug_id),
      { onlySession: session.id },
    );
    return;
  }
  // No rows for this session: its hold was already released (or replaced by a newer buyer).
  // Only repair a KV "reserved" that no reservation row backs; never touch another session's hold.
  for (const id of idsFrom(session)) {
    if (await isHeld(env, id)) continue;
    if ((await env.RUG_STATUS.get(`status:${id}`)) === 'reserved')
      await setStatus(env, id, 'available');
  }
}

async function onRefunded(env: Env, charge: Stripe.Charge) {
  const rugIds = (charge.metadata?.rugIds ?? '').split(',').filter(Boolean);
  const pi =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (pi)
    await env.DB.prepare("UPDATE orders SET status = 'refunded' WHERE stripe_payment_intent = ?")
      .bind(pi)
      .run();
  await env.DB.prepare('INSERT INTO audit_log (actor, action, rug_id, details) VALUES (?, ?, ?, ?)')
    .bind(
      'stripe',
      'charge.refunded',
      rugIds[0] ?? null,
      JSON.stringify({ charge: charge.id, amount: charge.amount_refunded }),
    )
    .run();
  await notifyAdmin(
    env,
    `Refund issued: ${rugIds.join(', ') || charge.id}`,
    `Charge ${charge.id} refunded $${(charge.amount_refunded / 100).toFixed(2)}.\nThe rug(s) stay marked SOLD. Relist manually in /admin if it comes back.`,
  );
}
