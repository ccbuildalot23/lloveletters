/** Streams a private R2 object to an authenticated admin (room/review photos). */
import type { Env } from '../../_lib/env';
import { error } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!/^(rooms|reviews|returns)\//.test(key)) return error('bad key');
  const obj = await env.UPLOADS.get(key);
  if (!obj) return error('not found', 404);
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'private, no-store',
      'content-disposition': 'inline',
    },
  });
};
