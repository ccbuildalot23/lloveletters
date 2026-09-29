import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from '../../functions/_lib/headers';

/** The global block of public/_headers (everything before the first path-specific rule). */
function staticGlobalHeaders(): Record<string, string> {
  const text = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  const block = text.split(/\n(?=\/)/)[0]!;
  const out: Record<string, string> = {};
  for (const line of block.split('\n').slice(1)) {
    const m = line.match(/^\s+([^:]+):\s*(.+)$/);
    if (m) out[m[1]!.toLowerCase()] = m[2]!.trim();
  }
  return out;
}

describe('security headers stay in sync between static assets and Functions', () => {
  const fromFile = staticGlobalHeaders();
  it('CSP is identical', () => {
    expect(fromFile['content-security-policy']).toBe(CONTENT_SECURITY_POLICY);
  });
  it('every other security header matches', () => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) expect(fromFile[k], k).toBe(v);
  });
  it('CSP allows the image origins the catalog uses', () => {
    expect(CONTENT_SECURITY_POLICY).toContain('https://images.unsplash.com');
    expect(CONTENT_SECURITY_POLICY).toContain('https://imagedelivery.net');
  });
  it('withSecurityHeaders adds missing headers and keeps existing ones', () => {
    const res = withSecurityHeaders(
      new Response('{}', {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=10' },
      }),
    );
    expect(res.headers.get('content-security-policy')).toBe(CONTENT_SECURITY_POLICY);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('cache-control')).toBe('public, max-age=10');
    expect(res.headers.get('content-type')).toBe('application/json');
  });
});
