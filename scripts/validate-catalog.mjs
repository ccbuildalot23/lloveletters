#!/usr/bin/env node
/** Validates src/data/products.json against the Zod schema. Exits non-zero on failure. */
import { readFileSync } from 'node:fs';
import { CatalogSchema } from '../src/lib/schema.ts';
import { priceWarning } from '../src/lib/pricing.ts';

const path = new URL('../src/data/products.json', import.meta.url);
const raw = JSON.parse(readFileSync(path, 'utf8'));
const result = CatalogSchema.safeParse(raw);
if (!result.success) {
  console.error('✖ products.json is invalid:\n');
  for (const issue of result.error.issues) {
    const idx = issue.path[0];
    const id = typeof idx === 'number' ? (raw[idx]?.id ?? `#${idx}`) : '';
    console.error(`  [${id}] ${issue.path.slice(1).join('.') || '(root)'}: ${issue.message}`);
  }
  process.exit(1);
}
for (const p of result.data) {
  const w = priceWarning(p.priceUsd, p.sizeBucket, p.condition);
  if (w) console.warn(`⚠ [${p.id}] ${w}`);
}
const samples = result.data.filter((p) => p.sample).length;
console.log(`✔ ${result.data.length} products valid (${samples} marked SAMPLE)`);
if (samples && process.env.CF_PAGES_BRANCH === 'main' && process.env.ALLOW_SAMPLE_DATA !== 'true') {
  console.warn(
    '⚠ Sample products are present on a production build. Set ALLOW_SAMPLE_DATA=true to silence.',
  );
}
