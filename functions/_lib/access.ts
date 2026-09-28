/**
 * Cloudflare Access verification for /admin (18.3). Access itself gates the route at the edge;
 * this verifies the Cf-Access-Jwt-Assertion header in Functions as defense in depth.
 */
import type { Env } from './env';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg: string;
}
let jwks: { at: number; keys: Jwk[] } | null = null;

function b64url(s: string): Uint8Array {
  const b = atob(
    s
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(s.length / 4) * 4, '='),
  );
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export async function verifyAccess(request: Request, env: Env): Promise<{ email: string } | null> {
  const token =
    request.headers.get('cf-access-jwt-assertion') ??
    request.headers.get('cookie')?.match(/CF_Authorization=([^;]+)/)?.[1];
  if (!env.ADMIN_ACCESS_AUD || !env.ADMIN_ACCESS_TEAM_DOMAIN) {
    // Local dev only: allow when running on localhost with no Access configured.
    const host = new URL(request.url).hostname;
    return host === 'localhost' || host === '127.0.0.1'
      ? { email: env.ADMIN_EMAIL || 'dev@localhost' }
      : null;
  }
  if (!token) return null;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64url(h))) as { kid: string; alg: string };
    const payload = JSON.parse(new TextDecoder().decode(b64url(p))) as {
      aud: string | string[];
      exp: number;
      email?: string;
      iss: string;
    };
    const issuer = `https://${env.ADMIN_ACCESS_TEAM_DOMAIN}`;
    if (payload.iss !== issuer && payload.iss !== `${issuer}.cloudflareaccess.com`) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ADMIN_ACCESS_AUD)) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!jwks || Date.now() - jwks.at > 3600_000) {
      const domain = env.ADMIN_ACCESS_TEAM_DOMAIN.includes('.')
        ? env.ADMIN_ACCESS_TEAM_DOMAIN
        : `${env.ADMIN_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`;
      const r = await fetch(`https://${domain}/cdn-cgi/access/certs`);
      jwks = { at: Date.now(), keys: ((await r.json()) as { keys: Jwk[] }).keys };
    }
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64url(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!ok || !payload.email) return null;
    if (env.ADMIN_EMAIL && payload.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase())
      return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
