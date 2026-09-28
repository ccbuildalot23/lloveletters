import { formHandler } from '../../_lib/forms';
import { NotifySchema } from '../../_lib/validate';
import { sendCapi } from '../../_lib/capi';

export const onRequestPost = formHandler({
  name: 'notify',
  schema: NotifySchema,
  handler: async (d, { env, ip, ua, request }) => {
    const res = await env.DB.prepare('INSERT OR IGNORE INTO notify (email, rug_id) VALUES (?, ?)')
      .bind(d.email, d.rug_id)
      .run();
    if (res.meta.changes === 0)
      return { already: true, message: 'You’re already on the list for this rug.' };
    await sendCapi(env, {
      name: 'Lead',
      eventId: `notify-${crypto.randomUUID()}`,
      email: d.email,
      ip,
      ua,
      sourceUrl: request.headers.get('referer') ?? undefined,
      custom: { form_type: 'notify' },
    });
  },
});
