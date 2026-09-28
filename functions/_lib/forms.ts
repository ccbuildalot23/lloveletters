/**
 * Shared form pipeline (11.1): honeypot → rate limit → Turnstile → Zod validation → handler → JSON or redirect.
 * Every public form uses this. Handlers receive the validated data and return an optional response payload.
 */
import type { z } from 'zod';
import type { Env } from './env';
import { json, parseBody, clientIp, wantsJson, logError } from './http';
import { rateLimited } from './ratelimit';
import { verifyTurnstile } from './turnstile';

export interface FormResult {
  message?: string;
  already?: boolean;
  redirect?: string;
  extra?: Record<string, unknown>;
}

export function formHandler<S extends z.ZodTypeAny>(opts: {
  name: string;
  schema: S;
  limitPerMinute?: number;
  handler: (
    data: z.infer<S>,
    ctx: { env: Env; request: Request; ip: string; ua: string; raw: Record<string, unknown> },
  ) => Promise<FormResult | void>;
}): PagesFunction<Env> {
  return async ({ request, env }) => {
    const asJson = wantsJson(request);
    const referer = request.headers.get('referer') ?? '/';
    const respond = (status: number, payload: Record<string, unknown>) => {
      if (asJson) return json(payload, status);
      const back = new URL(referer, request.url);
      back.searchParams.set(
        status < 400 ? 'sent' : 'error',
        status < 400 ? opts.name : String(payload.message ?? 'error'),
      );
      return Response.redirect(back.toString(), 303);
    };
    const ip = clientIp(request);
    const ua = request.headers.get('user-agent') ?? '';
    const raw = await parseBody(request);
    // Honeypot: bots fill hidden fields. Pretend success.
    if (typeof raw.website_url === 'string' && raw.website_url.trim() !== '')
      return respond(200, { ok: true });
    if (await rateLimited(env, `form:${opts.name}:${ip}`, opts.limitPerMinute ?? 10))
      return respond(429, {
        ok: false,
        message: 'Too many submissions. Please wait a minute and try again.',
      });
    if (!(await verifyTurnstile(env, raw.turnstile_token, ip, request)))
      return respond(400, {
        ok: false,
        message: 'Spam check failed. Please reload the page and try again.',
      });
    const parsed = opts.schema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      return respond(422, { ok: false, message: 'Please check the highlighted fields.', errors });
    }
    try {
      const result = (await opts.handler(parsed.data, { env, request, ip, ua, raw })) ?? {};
      return respond(200, { ok: true, ...result, ...(result.extra ?? {}) });
    } catch (err) {
      const fieldErrors = (err as { errors?: Record<string, string> })?.errors;
      if (fieldErrors)
        return respond(422, {
          ok: false,
          message: 'Please check the highlighted fields.',
          errors: fieldErrors,
        });
      logError(`form.${opts.name}`, err);
      return respond(500, {
        ok: false,
        message: 'Couldn’t save that. Please try again or email us.',
      });
    }
  };
}

export const sourceJson = (raw: Record<string, unknown>) => {
  const s = raw.source;
  if (typeof s !== 'string' || !s) return null;
  try {
    return JSON.stringify(JSON.parse(s));
  } catch {
    return JSON.stringify({ raw: s.slice(0, 200) });
  }
};
