/** Applies to every Function response: security headers, no-store, and structured error logging without PII. */
import type { Env } from './_lib/env';
import { logError, json } from './_lib/http';
import { withSecurityHeaders } from './_lib/headers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  try {
    return withSecurityHeaders(await ctx.next());
  } catch (err) {
    logError('unhandled', err, { path: new URL(ctx.request.url).pathname });
    if (ctx.request.headers.get('accept')?.includes('text/html'))
      return withSecurityHeaders(await ctx.env.ASSETS.fetch(new URL('/500', ctx.request.url)));
    return withSecurityHeaders(json({ ok: false, message: 'Server error' }, 500));
  }
};
