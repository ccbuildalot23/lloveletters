/** Tokenized post-purchase review (11.1). Token = HMAC(orderId) sent in the review-request email; stored pending. */
import { formHandler } from '../../_lib/forms';
import { ReviewSchema } from '../../_lib/validate';
import { notifyAdmin } from '../../_lib/email';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, sniffImageType, stripExif } from '../../_lib/exif';
import { verifyReviewToken } from '../../_lib/tokens';

export const onRequestPost = formHandler({
  name: 'review',
  schema: ReviewSchema,
  limitPerMinute: 3,
  handler: async (d, { env, raw }) => {
    const order = await verifyReviewToken(env, d.token);
    if (!order)
      throw Object.assign(new Error('bad token'), {
        errors: { token: 'This review link isn’t valid. Use the link from your email.' },
      });
    let photoKey: string | null = null;
    const f = raw.photo;
    if (f instanceof File && f.size > 0 && f.size <= MAX_UPLOAD_BYTES) {
      const buf = await f.arrayBuffer();
      const type = sniffImageType(new Uint8Array(buf));
      if (type && ALLOWED_IMAGE_TYPES.has(type)) {
        photoKey = `reviews/${order.id}/${Date.now()}`;
        await env.UPLOADS.put(photoKey, stripExif(buf, type), {
          httpMetadata: { contentType: type },
        });
      }
    }
    const rugIds = JSON.parse(order.rug_ids) as string[];
    await env.DB.prepare(
      'INSERT OR IGNORE INTO reviews (token, order_id, rug_id, rating, title, body, display_name, city, photo_key, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
    )
      .bind(
        d.token,
        order.id,
        rugIds[0] ?? null,
        d.rating,
        d.title ?? null,
        d.text,
        d.display_name,
        d.city ?? null,
        photoKey,
      )
      .run();
    await notifyAdmin(
      env,
      `New review (${d.rating}★) pending approval`,
      `${d.display_name}${d.city ? `, ${d.city}` : ''}\n${d.title ?? ''}\n${d.text}\n\nApprove in ${env.PUBLIC_SITE_URL}/admin/reviews`,
    );
    return {
      message:
        'Thank you. Your review is in the queue and will appear once I’ve checked it against the order.',
    };
  },
});
