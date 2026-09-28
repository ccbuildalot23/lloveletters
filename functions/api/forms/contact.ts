import { formHandler } from '../../_lib/forms';
import { ContactSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';

export const onRequestPost = formHandler({
  name: 'contact',
  schema: ContactSchema,
  limitPerMinute: 5,
  handler: async (d, { env }) => {
    await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, rug_id) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(d.name, d.email, d.subject ?? null, d.message, d.rug_id ?? null)
      .run();
    await notifyAdmin(
      env,
      `Contact: ${d.subject ?? (d.rug_id ? `about ${d.rug_id}` : 'new message')}`,
      `${d.name} <${d.email}>\n${d.rug_id ? `Rug: ${d.rug_id}\n` : ''}\n${d.message}`,
    );
    return { message: 'Message received. I reply to every one, usually the same day.' };
  },
});
