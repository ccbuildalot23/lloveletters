import { formHandler } from '../../_lib/forms';
import { ReturnSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, sniffImageType, stripExif } from '../../_lib/exif';

export const onRequestPost = formHandler({
  name: 'return',
  schema: ReturnSchema,
  limitPerMinute: 4,
  handler: async (d, { env, raw }) => {
    const files = ([] as unknown[])
      .concat(raw.photos ?? [])
      .filter((f): f is File => f instanceof File && f.size > 0)
      .slice(0, 4);
    const keys: string[] = [];
    for (const f of files) {
      if (f.size > MAX_UPLOAD_BYTES) continue;
      const buf = await f.arrayBuffer();
      const type = sniffImageType(new Uint8Array(buf));
      if (!type || !ALLOWED_IMAGE_TYPES.has(type)) continue;
      const key = `returns/${d.rug_id}/${Date.now()}-${crypto.randomUUID()}`;
      await env.UPLOADS.put(key, stripExif(buf, type), { httpMetadata: { contentType: type } });
      keys.push(key);
    }
    await env.DB.prepare(
      'INSERT INTO return_requests (order_email, order_number, rug_id, reason, photo_keys) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(d.order_email, d.order_number, d.rug_id, d.reason ?? null, JSON.stringify(keys))
      .run();
    await notifyAdmin(
      env,
      `Return request: ${d.rug_id}`,
      `Order ${d.order_number} · ${d.order_email}\nReason: ${d.reason ?? '—'}\nPhotos: ${keys.length}\nReply with the return label within 1 business day.`,
    );
    return {
      message:
        'Return started. You’ll get a prepaid label and instructions by email within one business day.',
    };
  },
});
