/** Fixed-window rate limit in KV (8.5a / 11.1). Good enough for form spam; not a DDoS shield. */
import type { Env } from './env';

export async function rateLimited(
  env: Env,
  key: string,
  limitPerMinute = Number(env.RATE_LIMIT_PER_MINUTE || 10),
): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60000);
  const k = `rl:${key}:${minute}`;
  const cur = Number((await env.RUG_STATUS.get(k)) ?? 0);
  if (cur >= limitPerMinute) return true;
  await env.RUG_STATUS.put(k, String(cur + 1), { expirationTtl: 120 });
  return false;
}
