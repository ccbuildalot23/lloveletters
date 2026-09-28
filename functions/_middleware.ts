/** Applies to every Function response: no-store, nosniff, and structured error logging without PII. */
import type { Env } from './_lib/env';
import { logError, json } from './_lib/http';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  try {
    const res = await ctx.next();
    const headers = new Headers(res.headers);
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  } catch (err) {
    logError('unhandled', err, { path: new URL(ctx.request.url).pathname });
    if (ctx.request.headers.get('accept')?.includes('text/html'))
      return ctx.env.ASSETS.fetch(new URL('/500', ctx.request.url));
    return json({ ok: false, message: 'Server error' }, 500);
  }
};
