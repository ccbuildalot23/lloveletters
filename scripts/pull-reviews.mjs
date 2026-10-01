#!/usr/bin/env node
/**
 * Pulls approved reviews from the Access-protected export endpoint into src/data/reviews.json.
 *
 * Env: REVIEWS_EXPORT_URL (https://<site>/api/admin/reviews-export), CF_ACCESS_CLIENT_ID,
 *      CF_ACCESS_CLIENT_SECRET (a Cloudflare Access service token allowed on the /api/admin app).
 * Unset → "skipped", existing snapshot untouched, exit 0.
 * Configured but failing (network, non-2xx, login HTML, invalid shape) → exit 1, snapshot untouched.
 * Only public review fields are written; nothing private (emails, tokens, moderation data) leaves D1.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const url = process.env.REVIEWS_EXPORT_URL;
const id = process.env.CF_ACCESS_CLIENT_ID;
const secret = process.env.CF_ACCESS_CLIENT_SECRET;
const target = new URL('../src/data/reviews.json', import.meta.url);

if (!url || !id || !secret) {
  console.log(
    'pull-reviews: skipped (REVIEWS_EXPORT_URL / CF_ACCESS_CLIENT_* not set); keeping the existing snapshot.',
  );
  process.exit(0);
}
let endpoint;
try {
  endpoint = new URL(url);
} catch {
  fail(`REVIEWS_EXPORT_URL is not a URL: ${url}`);
}
if (endpoint.protocol !== 'https:') fail('REVIEWS_EXPORT_URL must be https://');
if (!endpoint.pathname.endsWith('/api/admin/reviews-export'))
  fail('REVIEWS_EXPORT_URL must point at /api/admin/reviews-export');

let res;
try {
  res = await fetch(endpoint, {
    headers: {
      'CF-Access-Client-Id': id,
      'CF-Access-Client-Secret': secret,
      accept: 'application/json',
    },
    redirect: 'error', // never follow a redirect with service-token headers attached
    signal: AbortSignal.timeout(15_000),
  });
} catch (err) {
  fail(`request failed: ${err instanceof Error ? err.message : String(err)}`);
}
if (!res.ok) fail(`export returned HTTP ${res.status}`);
if (!(res.headers.get('content-type') ?? '').includes('application/json'))
  fail(
    'export did not return JSON (an Access login page usually means the service token is not allowed on this app)',
  );

const data = await res.json();
if (!Array.isArray(data)) fail('export payload is not an array');
const PUBLIC_FIELDS = [
  'id',
  'rating',
  'title',
  'body',
  'displayName',
  'city',
  'date',
  'verified',
  'rugId',
  'photo',
];
const reviews = data.map((r, i) => {
  if (!r || typeof r !== 'object') fail(`review #${i} is not an object`);
  const rating = Number(r.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    fail(`review #${i} has an invalid rating`);
  if (typeof r.body !== 'string' || !r.body.trim()) fail(`review #${i} has no body`);
  if (typeof r.displayName !== 'string' || !r.displayName.trim())
    fail(`review #${i} has no displayName`);
  const out = {};
  for (const k of PUBLIC_FIELDS) if (r[k] !== undefined && r[k] !== null) out[k] = r[k];
  return out;
});

const tmp = new URL(`${target.pathname}.tmp`, target);
writeFileSync(tmp, JSON.stringify(reviews, null, 2) + '\n');
renameSync(tmp, target);
const before = JSON.parse(readFileSync(target, 'utf8')).length;
console.log(
  `✔ pull-reviews: wrote ${reviews.length} approved review(s) to src/data/reviews.json (${before === reviews.length ? 'verified' : 'mismatch'})`,
);
if (reviews.length === 0) console.log('  (legitimately empty export: no approved reviews yet)');

function fail(msg) {
  console.error(`✖ pull-reviews: ${msg}. Existing src/data/reviews.json left untouched.`);
  process.exit(1);
}
