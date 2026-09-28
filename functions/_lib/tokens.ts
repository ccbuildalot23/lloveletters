/** HMAC tokens for post-purchase review links. */
import type { Env } from './env';

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export async function reviewToken(env: Env, orderId: number): Promise<string> {
  const secret = env.REVIEW_TOKEN_SECRET || env.STRIPE_WEBHOOK_SECRET || 'dev-secret';
  return `${orderId}.${await hmac(secret, `review:${orderId}`)}`;
}

export async function verifyReviewToken(
  env: Env,
  token: string,
): Promise<{ id: number; rug_ids: string; email: string | null } | null> {
  const [idStr, sig] = token.split('.');
  const id = Number(idStr);
  if (!id || !sig) return null;
  const expected = (await reviewToken(env, id)).split('.')[1];
  if (expected !== sig) return null;
  return env.DB.prepare('SELECT id, rug_ids, email FROM orders WHERE id = ?')
    .bind(id)
    .first<{ id: number; rug_ids: string; email: string | null }>();
}
