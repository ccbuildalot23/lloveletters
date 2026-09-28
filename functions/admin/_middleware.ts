/** Guards the static /admin pages: without a valid Access JWT, return 401 instead of the page. */
import type { Env } from '../_lib/env';
import { verifyAccess } from '../_lib/access';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const user = await verifyAccess(ctx.request, ctx.env);
  if (!user)
    return new Response('Unauthorized. Sign in through Cloudflare Access.', {
      status: 401,
      headers: { 'content-type': 'text/plain' },
    });
  return ctx.env.ASSETS.fetch(ctx.request);
};
