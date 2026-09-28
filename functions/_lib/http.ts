/** Small response helpers and request parsing for Pages Functions. */
export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });

export const error = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ ok: false, message, ...extra }, status);

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  );
}

export function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  const ct = request.headers.get('content-type') ?? '';
  return accept.includes('application/json') || ct.includes('application/json');
}

/** Parses JSON, urlencoded, or multipart bodies into a plain object (files kept as File). */
export async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      return (await request.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (ct.includes('form')) {
    const fd = await request.formData();
    const out: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) {
      if (k in out) {
        const cur = out[k];
        out[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
      } else out[k] = v;
    }
    for (const k of ['interests', 'project_types', 'colors', 'rugIds'])
      if (k in out && !Array.isArray(out[k])) out[k] = [out[k]];
    return out;
  }
  return {};
}

/** Never log PII: strip emails/phones from arbitrary strings before logging (16.2). */
export function scrub(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]');
}

export function logError(scope: string, err: unknown, ctx: Record<string, unknown> = {}) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      level: 'error',
      scope,
      message: scrub(msg),
      ...ctx,
      ts: new Date().toISOString(),
    }),
  );
}
