/** Cloudflare Turnstile server-side verification (2.8). */
import type { Env } from './env';

export async function verifyTurnstile(
  env: Env,
  token: unknown,
  ip: string,
  request?: Request,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) {
    // Fail closed in production; allow only on local dev hosts.
    const host = request ? new URL(request.url).hostname : '';
    return host === 'localhost' || host === '127.0.0.1';
  }
  if (typeof token !== 'string' || !token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
