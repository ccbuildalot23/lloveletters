/** Deploy hook trigger, debounced to once per 5 minutes (8.6). */
import type { Env } from './env';
import { logError } from './http';

export async function triggerDeploy(
  env: Env,
  reason: string,
): Promise<'triggered' | 'debounced' | 'unconfigured'> {
  if (!env.DEPLOY_HOOK_URL) return 'unconfigured';
  const row = await env.DB.prepare("SELECT value FROM kv_meta WHERE key = 'last_deploy'").first<{
    value: string;
  }>();
  const last = Number(row?.value ?? 0);
  if (Date.now() - last < 5 * 60 * 1000) return 'debounced';
  await env.DB.prepare(
    "INSERT INTO kv_meta (key, value) VALUES ('last_deploy', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  )
    .bind(String(Date.now()))
    .run();
  try {
    await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    await env.DB.prepare('INSERT INTO audit_log (actor, action, details) VALUES (?, ?, ?)')
      .bind('system', 'deploy_hook', reason)
      .run();
    return 'triggered';
  } catch (err) {
    logError('deploy', err);
    return 'unconfigured';
  }
}
