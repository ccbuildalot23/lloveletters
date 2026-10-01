import { formHandler } from '../../_lib/forms';
import { ContactSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { decide, jevRecord, jevSummary, minimizeState, CONTACT_QUESTIONS } from '../../_lib/jev';

export const onRequestPost = formHandler({
  name: 'contact',
  schema: ContactSchema,
  limitPerMinute: 5,
  handler: async (d, { env }) => {
    // Advisory routing only (docs/JEV.md); the message is stored and answered by a person regardless.
    const jev = await decide(
      env,
      minimizeState(d, ['subject', 'message', 'rug_id']),
      CONTACT_QUESTIONS,
    );
    await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, rug_id, jev) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(d.name, d.email, d.subject ?? null, d.message, d.rug_id ?? null, jevRecord(jev))
      .run();
    await notifyAdmin(
      env,
      `Contact: ${d.subject ?? (d.rug_id ? `about ${d.rug_id}` : 'new message')}`,
      `${d.name} <${d.email}>\n${d.rug_id ? `Rug: ${d.rug_id}\n` : ''}\n${d.message}${jev ? `\n\n${jevSummary(jev)}` : ''}`,
    );
    return { message: 'Message received. I reply to every one, usually the same day.' };
  },
});
