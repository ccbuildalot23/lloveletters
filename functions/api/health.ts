/** Reports which integrations are configured (no secrets). Used by tests and the launch checklist. */
import type { Env } from '../_lib/env';
import { json } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let db = false;
  try {
    await env.DB.prepare('SELECT 1').first();
    db = true;
  } catch {
    db = false;
  }
  return json({
    ok: true,
    launchMode: env.LAUNCH_MODE ?? 'waitlist',
    stripe: !!env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_'),
    stripeWebhook: !!env.STRIPE_WEBHOOK_SECRET,
    turnstile: !!env.TURNSTILE_SECRET,
    db,
    emailProvider: env.EMAIL_PROVIDER ?? 'none',
    adminEmail: env.ADMIN_EMAIL_PROVIDER ?? 'none',
    capi: !!(env.META_PIXEL_ID && env.META_CAPI_TOKEN),
    deployHook: !!env.DEPLOY_HOOK_URL,
    access: !!(env.ADMIN_ACCESS_AUD && env.ADMIN_ACCESS_TEAM_DOMAIN),
  });
};
