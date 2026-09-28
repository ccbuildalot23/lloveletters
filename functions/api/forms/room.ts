/** "See it in my room": multipart upload → R2 (≤10MB, jpg/png/heic, EXIF stripped) → D1 → admin email. */
import { formHandler, sourceJson } from '../../_lib/forms';
import { RoomSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { stripExif, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, sniffImageType } from '../../_lib/exif';

export const onRequestPost = formHandler({
  name: 'room',
  schema: RoomSchema,
  limitPerMinute: 4,
  handler: async (d, { env, raw }) => {
    const file = raw.photo;
    if (!(file instanceof File) || file.size === 0)
      throw Object.assign(new Error('photo required'), {
        errors: { photo: 'Please attach a room photo.' },
      });
    if (file.size > MAX_UPLOAD_BYTES)
      throw Object.assign(new Error('too large'), {
        errors: { photo: 'That photo is over 10MB. Please resize it and try again.' },
      });
    const buf = await file.arrayBuffer();
    const sniffed = sniffImageType(new Uint8Array(buf));
    if (!sniffed || !ALLOWED_IMAGE_TYPES.has(sniffed))
      throw Object.assign(new Error('bad type'), {
        errors: { photo: 'Only JPG, PNG, or HEIC photos, please.' },
      });
    const clean = stripExif(buf, sniffed);
    const ext = sniffed === 'image/jpeg' ? 'jpg' : sniffed === 'image/png' ? 'png' : 'heic';
    const key = `rooms/${d.rug_id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    await env.UPLOADS.put(key, clean, {
      httpMetadata: { contentType: sniffed },
      customMetadata: { email: d.email, rugId: d.rug_id },
    });
    await env.DB.prepare(
      'INSERT INTO room_uploads (email, rug_id, r2_key, content_type, size_bytes, room_dimensions, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        d.email,
        d.rug_id,
        key,
        sniffed,
        clean.byteLength,
        d.room_dimensions ?? null,
        d.notes ?? null,
      )
      .run();
    await notifyAdmin(
      env,
      `Room mockup request: ${d.rug_id}`,
      `${d.email}\nRoom: ${d.room_dimensions ?? '—'}\nNotes: ${d.notes ?? '—'}\nPhoto: ${env.PUBLIC_SITE_URL}/admin/leads (signed link)\nSource: ${sourceJson(raw) ?? '—'}`,
    );
    return { message: 'Got the photo. Mockup coming within 24 hours.' };
  },
});
