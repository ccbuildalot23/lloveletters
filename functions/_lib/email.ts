/** Pluggable email (2.7): admin notifications + marketing list sync. All providers are optional. */
import type { Env } from './env';
import { logError } from './http';

export async function notifyAdmin(env: Env, subject: string, text: string): Promise<void> {
  const to = env.ADMIN_EMAIL;
  if (!to) return;
  const from = env.ADMIN_EMAIL_FROM || `store@${safeHost(env.PUBLIC_SITE_URL)}`;
  const provider = env.ADMIN_EMAIL_PROVIDER || 'none';
  try {
    if (provider === 'resend' && env.ADMIN_EMAIL_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.ADMIN_EMAIL_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text }),
      });
    } else if (provider === 'postmark' && env.ADMIN_EMAIL_API_KEY) {
      await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': env.ADMIN_EMAIL_API_KEY,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ From: from, To: to, Subject: subject, TextBody: text }),
      });
    } else if (provider === 'mailchannels') {
      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(env.ADMIN_EMAIL_API_KEY ? { 'X-Api-Key': env.ADMIN_EMAIL_API_KEY } : {}),
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
    } else {
      console.log(
        JSON.stringify({
          level: 'info',
          scope: 'email',
          note: 'no admin email provider configured',
          subject,
        }),
      );
    }
  } catch (err) {
    logError('notifyAdmin', err);
  }
}

export interface Subscriber {
  email: string;
  firstName?: string;
  tags?: string[];
  source?: string;
}

/** Adds a subscriber to Kit (ConvertKit) or Klaviyo with interest tags (11.3). Double opt-in is configured in the provider. */
export async function syncSubscriber(env: Env, sub: Subscriber): Promise<boolean> {
  const provider = env.EMAIL_PROVIDER || 'none';
  if (provider === 'none' || !env.EMAIL_API_KEY) return false;
  try {
    if (provider === 'kit') {
      // Kit API v4: https://developers.kit.com/v4 — [verify endpoints]
      const r = await fetch('https://api.kit.com/v4/subscribers', {
        method: 'POST',
        headers: { 'X-Kit-Api-Key': env.EMAIL_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({
          email_address: sub.email,
          first_name: sub.firstName ?? '',
          fields: { source: sub.source ?? '' },
        }),
      });
      if (!r.ok && r.status !== 409) throw new Error(`kit ${r.status}`);
      if (env.EMAIL_LIST_ID)
        await fetch(`https://api.kit.com/v4/forms/${env.EMAIL_LIST_ID}/subscribers`, {
          method: 'POST',
          headers: { 'X-Kit-Api-Key': env.EMAIL_API_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ email_address: sub.email }),
        });
      for (const tag of sub.tags ?? []) {
        await fetch('https://api.kit.com/v4/tags', {
          method: 'POST',
          headers: { 'X-Kit-Api-Key': env.EMAIL_API_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ name: tag }),
        }).catch(() => null);
      }
      return true;
    }
    if (provider === 'klaviyo') {
      // Klaviyo: https://developers.klaviyo.com/en/reference/subscribe_profiles — [verify revision]
      const r = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${env.EMAIL_API_KEY}`,
          'content-type': 'application/json',
          revision: '2025-07-15',
        },
        body: JSON.stringify({
          data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {
              profiles: {
                data: [
                  {
                    type: 'profile',
                    attributes: {
                      email: sub.email,
                      first_name: sub.firstName,
                      properties: { interests: sub.tags, source: sub.source },
                      subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                    },
                  },
                ],
              },
            },
            relationships: { list: { data: { type: 'list', id: env.EMAIL_LIST_ID } } },
          },
        }),
      });
      if (!r.ok) throw new Error(`klaviyo ${r.status}`);
      return true;
    }
  } catch (err) {
    logError('syncSubscriber', err);
  }
  return false;
}

function safeHost(url: string | undefined) {
  try {
    return new URL(url ?? 'https://example.com').hostname;
  } catch {
    return 'example.com';
  }
}
