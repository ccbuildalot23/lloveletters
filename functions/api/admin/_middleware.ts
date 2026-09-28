import type { Env } from '../../_lib/env';
import { verifyAccess } from '../../_lib/access';
import { json } from '../../_lib/http';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const user = await verifyAccess(ctx.request, ctx.env);
  if (!user) return json({ ok: false, message: 'Unauthorized' }, 401);
  ctx.data.user = user;
  return ctx.next();
};
