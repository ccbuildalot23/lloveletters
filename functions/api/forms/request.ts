import { formHandler, sourceJson } from '../../_lib/forms';
import { RequestSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { sendCapi } from '../../_lib/capi';

export const onRequestPost = formHandler({
  name: 'request',
  schema: RequestSchema,
  handler: async (d, { env, ip, ua, raw, request }) => {
    await env.DB.prepare(
      'INSERT INTO requests (email, size, style, colors, budget, notes, criteria, rug_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        d.email,
        d.size ?? null,
        d.style ?? null,
        JSON.stringify(d.colors),
        d.budget ?? null,
        d.notes ?? null,
        d.criteria ?? null,
        d.rug_id ?? null,
        sourceJson(raw),
      )
      .run();
    await notifyAdmin(
      env,
      `Rug request${d.rug_id ? ` (like ${d.rug_id})` : ''}`,
      `${d.email}\nSize: ${d.size ?? '—'} · Style: ${d.style ?? '—'} · Colors: ${d.colors.join(', ') || '—'} · Budget: ${d.budget ?? '—'}\nNotes: ${d.notes ?? '—'}\nCriteria: ${d.criteria ?? '—'}`,
    );
    await sendCapi(env, {
      name: 'Lead',
      eventId: `req-${crypto.randomUUID()}`,
      email: d.email,
      ip,
      ua,
      sourceUrl: request.headers.get('referer') ?? undefined,
      custom: { form_type: 'request' },
    });
  },
});
