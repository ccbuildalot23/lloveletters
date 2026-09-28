import { formHandler, sourceJson } from '../../_lib/forms';
import { TradeSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { sendCapi } from '../../_lib/capi';

export const onRequestPost = formHandler({
  name: 'trade',
  schema: TradeSchema,
  limitPerMinute: 4,
  handler: async (d, { env, ip, ua, raw, request }) => {
    await env.DB.prepare(
      'INSERT INTO trade_applications (name, firm, website, email, phone, city_state, project_types, resale_cert, heard_from, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        d.name,
        d.firm,
        d.website,
        d.email,
        d.phone,
        d.city_state,
        JSON.stringify(d.project_types),
        d.resale_cert ?? null,
        d.heard_from ?? null,
        sourceJson(raw),
      )
      .run();
    await notifyAdmin(
      env,
      `Trade application: ${d.firm}`,
      `${d.name} at ${d.firm} (${d.city_state})\n${d.website}\n${d.email} · ${d.phone}\nProjects: ${d.project_types.join(', ') || '—'}\nResale cert: ${d.resale_cert ?? '—'}\nHeard from: ${d.heard_from ?? '—'}\n\nApprove in ${env.PUBLIC_SITE_URL}/admin/leads`,
    );
    await sendCapi(env, {
      name: 'Lead',
      eventId: `trade-${crypto.randomUUID()}`,
      email: d.email,
      phone: d.phone,
      ip,
      ua,
      sourceUrl: request.headers.get('referer') ?? undefined,
      custom: { form_type: 'trade' },
    });
    return {
      message: 'Application received. I review every one personally and reply within 48 hours.',
    };
  },
});
