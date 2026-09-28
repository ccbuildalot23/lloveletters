import { formHandler, sourceJson } from '../../_lib/forms';
import { WaitlistSchema } from '../../_lib/validate';
import { syncSubscriber } from '../../_lib/email';
import { sendCapi } from '../../_lib/capi';

export const onRequestPost = formHandler({
  name: 'waitlist',
  schema: WaitlistSchema,
  limitPerMinute: 6,
  handler: async (d, { env, ip, ua, raw, request }) => {
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, first_name, interests, source) VALUES (?, ?, ?, ?)',
    )
      .bind(d.email, d.first_name ?? null, JSON.stringify(d.interests), sourceJson(raw))
      .run();
    if (res.meta.changes === 0)
      return {
        already: true,
        message:
          'You’re already on the list — thanks for the enthusiasm. I’ll email you when the next drop lands.',
      };
    const synced = await syncSubscriber(env, {
      email: d.email,
      firstName: d.first_name,
      tags: ['waitlist', ...d.interests],
      source: 'waitlist',
    });
    if (synced)
      await env.DB.prepare('UPDATE waitlist SET synced_at = ? WHERE email = ?')
        .bind(new Date().toISOString(), d.email)
        .run();
    await sendCapi(env, {
      name: 'Lead',
      eventId: `lead-${crypto.randomUUID()}`,
      email: d.email,
      ip,
      ua,
      sourceUrl: request.headers.get('referer') ?? undefined,
      custom: { form_type: 'waitlist' },
    });
  },
});
