#!/usr/bin/env node
/**
 * Optional, warn-only copy check with Jev (docs/JEV.md): for every product, three yes/no questions
 * (investment claim, implied silk, pressure tactic). Never fails the build; the deterministic checks
 * in scripts/validate-catalog.mjs remain authoritative and run without a key.
 * JEV_API_KEY unset or JEV_DISABLED=true → "skipped", exit 0. JEV_WARN_THRESHOLD (default 0.5).
 */
import { readFileSync } from 'node:fs';
import { buildJevRequest, parseJevResponse } from '../functions/_lib/jev.ts';

const key = process.env.JEV_API_KEY;
if (!key || process.env.JEV_DISABLED === 'true') {
  console.log('jev:catalog skipped (JEV_API_KEY not set or JEV_DISABLED=true); no inference ran.');
  process.exit(0);
}
const threshold = Number(process.env.JEV_WARN_THRESHOLD ?? 0.5);
const env = { JEV_API_KEY: key, JEV_MODEL: process.env.JEV_MODEL, JEV_DISABLED: undefined };
const products = JSON.parse(
  readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'),
);
const QUESTIONS = {
  investment_claim: {
    type: 'noul',
    instructions:
      'Does this product copy make an investment, appreciation, or resale-value claim about the rug?',
  },
  implies_silk: {
    type: 'noul',
    instructions:
      'Does this copy imply silk content or a silk-like fiber ("silky", "art silk", "sheen like silk") when pileFiber does not include silk?',
  },
  pressure_tactic: {
    type: 'noul',
    instructions:
      'Does this copy read like a countdown, artificial scarcity, or pressure tactic rather than a plain description? A one-of-a-kind rug being sold once is not a pressure tactic by itself.',
  },
};
let warned = 0;
let failed = 0;
for (const p of products) {
  const state = { title: p.title, description: p.description, pileFiber: p.pileFiber };
  const { url, init } = buildJevRequest(env, state, QUESTIONS);
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      failed++;
      console.warn(`⚠ [${p.id}] jev HTTP ${res.status}; check skipped for this rug`);
      continue;
    }
    const parsed = parseJevResponse(await res.json(), QUESTIONS);
    if (!parsed) {
      failed++;
      console.warn(`⚠ [${p.id}] jev returned an unexpected shape; check skipped for this rug`);
      continue;
    }
    for (const [name, a] of Object.entries(parsed.answers))
      if (a.noul >= threshold) {
        warned++;
        console.warn(`⚠ [${p.id}] ${name} ${a.noul.toFixed(2)} (advisory; read the copy)`);
      }
  } catch (err) {
    failed++;
    console.warn(
      `⚠ [${p.id}] jev unreachable (${err instanceof Error ? err.name : 'error'}); check skipped`,
    );
  }
}
console.log(
  `jev:catalog done: ${products.length} products, ${warned} advisory warning(s), ${failed} skipped by errors. Exit 0 (warn-only).`,
);
