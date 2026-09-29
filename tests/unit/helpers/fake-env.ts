/**
 * Minimal in-memory stand-ins for the D1 and KV bindings, enough to exercise the reservation lock
 * and the webhook idempotency path without Wrangler. Each SQL statement the code under test issues
 * is matched by a regex; anything unmatched throws so a new query cannot pass silently.
 */
import type { Env } from '../../../functions/_lib/env';

// The root tsconfig (astro check) has no Workers globals, so name the binding types through Env.
type D1 = Env['DB'];
type KV = Env['RUG_STATUS'];
type RunResult = Awaited<ReturnType<ReturnType<D1['prepare']>['run']>>;

type Row = Record<string, unknown>;
export interface FakeDb {
  reservations: Map<string, { rug_id: string; session_id: string | null; expires_at: number }>;
  processed: Set<string>;
  orders: Row[];
  audit: Row[];
  statements: string[];
}

function makeD1(db: FakeDb): D1 {
  const run = (sql: string, args: unknown[]) => {
    db.statements.push(sql);
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('DELETE FROM reservations WHERE expires_at <')) {
      for (const [k, v] of db.reservations)
        if (v.expires_at < (args[0] as number)) db.reservations.delete(k);
      return { changes: 0, results: [] };
    }
    if (s.startsWith('INSERT OR IGNORE INTO reservations')) {
      const [rug_id, session_id, expires_at] = args as [string, string, number];
      if (db.reservations.has(rug_id)) return { changes: 0, results: [] };
      db.reservations.set(rug_id, { rug_id, session_id, expires_at });
      return { changes: 1, results: [] };
    }
    if (s.startsWith('DELETE FROM reservations WHERE rug_id IN')) {
      const n = (s.match(/\?/g) ?? []).length - (s.includes('session_id = ?') ? 1 : 0);
      const ids = args.slice(0, n) as string[];
      const session = s.includes('session_id = ?') ? (args[n] as string) : undefined;
      let changes = 0;
      for (const id of ids) {
        const r = db.reservations.get(id);
        if (r && (session === undefined || r.session_id === session)) {
          db.reservations.delete(id);
          changes++;
        }
      }
      return { changes, results: [] };
    }
    if (s.startsWith('DELETE FROM reservations WHERE rug_id = ? AND session_id = ?')) {
      const r = db.reservations.get(args[0] as string);
      if (r && r.session_id === args[1]) db.reservations.delete(args[0] as string);
      return { changes: r ? 1 : 0, results: [] };
    }
    if (s.startsWith('DELETE FROM reservations WHERE rug_id = ?')) {
      const had = db.reservations.delete(args[0] as string);
      return { changes: had ? 1 : 0, results: [] };
    }
    if (s.startsWith('UPDATE reservations SET session_id = ?')) {
      let changes = 0;
      for (const r of db.reservations.values())
        if (r.session_id === args[1] && (args.slice(2) as string[]).includes(r.rug_id)) {
          r.session_id = args[0] as string;
          changes++;
        }
      return { changes, results: [] };
    }
    if (
      s.startsWith('SELECT rug_id, session_id, expires_at FROM reservations WHERE session_id = ?')
    )
      return {
        changes: 0,
        results: [...db.reservations.values()].filter((r) => r.session_id === args[0]),
      };
    if (
      s.startsWith(
        'SELECT rug_id, session_id, expires_at FROM reservations WHERE session_id LIKE ?',
      )
    ) {
      const suffix = String(args[0]).replace(/^%/, '');
      return {
        changes: 0,
        results: [...db.reservations.values()].filter(
          (r) => r.session_id?.endsWith(suffix) && r.expires_at > (args[1] as number),
        ),
      };
    }
    if (s.startsWith('SELECT rug_id FROM reservations WHERE rug_id = ?')) {
      const r = db.reservations.get(args[0] as string);
      return { changes: 0, results: r ? [{ rug_id: r.rug_id }] : [] };
    }
    if (s.startsWith('INSERT OR IGNORE INTO processed_events')) {
      if (db.processed.has(args[0] as string)) return { changes: 0, results: [] };
      db.processed.add(args[0] as string);
      return { changes: 1, results: [] };
    }
    if (s.startsWith('DELETE FROM processed_events WHERE event_id = ?')) {
      const had = db.processed.delete(args[0] as string);
      return { changes: had ? 1 : 0, results: [] };
    }
    if (s.startsWith('INSERT INTO audit_log')) {
      db.audit.push({ args });
      return { changes: 1, results: [] };
    }
    if (s.startsWith("UPDATE orders SET status = 'refunded'")) return { changes: 0, results: [] };
    if (s.startsWith('SELECT value FROM kv_meta')) return { changes: 0, results: [] };
    if (s.startsWith('INSERT INTO kv_meta')) return { changes: 1, results: [] };
    throw new Error(`fake D1 has no handler for: ${s}`);
  };
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    run: async () => {
      const r = run(sql, args);
      return {
        success: true,
        meta: { changes: r.changes },
        results: r.results,
      } as unknown as RunResult;
    },
    all: async () => {
      const r = run(sql, args);
      return {
        success: true,
        meta: { changes: r.changes },
        results: r.results,
      } as unknown as RunResult;
    },
    first: async () => {
      const r = run(sql, args);
      return (r.results[0] ?? null) as unknown;
    },
  });
  return { prepare: (sql: string) => stmt(sql) } as unknown as D1;
}

function makeKV(store: Map<string, string>): KV {
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v);
    },
    delete: async (k: string) => {
      store.delete(k);
    },
  } as unknown as KV;
}

export function fakeEnv(overrides: Partial<Env> = {}) {
  const db: FakeDb = {
    reservations: new Map(),
    processed: new Set(),
    orders: [],
    audit: [],
    statements: [],
  };
  const kv = new Map<string, string>();
  const env = {
    DB: makeD1(db),
    RUG_STATUS: makeKV(kv),
    UPLOADS: {} as Env['UPLOADS'],
    ASSETS: { fetch: async () => new Response('{}') } as unknown as Env['ASSETS'],
    PUBLIC_SITE_URL: 'https://example.test',
    PUBLIC_BRAND_NAME: 'Test',
    PUBLIC_DEALER_NAME: 'Test LLC',
    PUBLIC_PHONE: '',
    PUBLIC_EMAIL: '',
    LAUNCH_MODE: 'live',
    EMAIL_PROVIDER: 'none',
    ADMIN_EMAIL_PROVIDER: 'none',
    STRIPE_SECRET_KEY: 'sk_test_synthetic',
    STRIPE_WEBHOOK_SECRET: 'whsec_synthetic_test_secret',
    TURNSTILE_SECRET: '',
    ADMIN_EMAIL: '',
    ...overrides,
  } as Env;
  return { env, db, kv };
}
