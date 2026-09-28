import type { Env } from '../../_lib/env';
import { json } from '../../_lib/http';
import { triggerDeploy } from '../../_lib/deploy';

export const onRequestPost: PagesFunction<Env> = async ({ env, data }) => {
  const result = await triggerDeploy(env, `manual by ${(data.user as { email: string }).email}`);
  return json({ ok: result === 'triggered', result });
};
