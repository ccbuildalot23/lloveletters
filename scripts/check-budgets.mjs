#!/usr/bin/env node
/** 12.3 Size budgets (gzip) on the built site. Fails CI when exceeded. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const gz = (p) => gzipSync(readFileSync(p)).length;
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const BUDGET = {
  css: 50 * 1024,
  jsHome: 60 * 1024,
  jsProduct: 90 * 1024,
  fonts: 120 * 1024,
  heroPoster: 150 * 1024,
};
let failed = false;
const check = (label, size, budget) => {
  const ok = size <= budget;
  console.log(`${ok ? '✔' : '✖'} ${label}: ${kb(size)} (budget ${kb(budget)})`);
  if (!ok) failed = true;
};

const astro = join(dist, '_astro');
const files = readdirSync(astro);
const css = files.filter((f) => f.endsWith('.css')).reduce((s, f) => s + gz(join(astro, f)), 0);
check('Total CSS', css, BUDGET.css);

function pageJs(html) {
  const src = readFileSync(join(dist, html), 'utf8');
  const scripts = [...src.matchAll(/<script[^>]+src="\/(_astro\/[^"]+\.js)"/g)].map((m) => m[1]);
  // Follow static imports one level (Astro emits shared chunks via import).
  const seen = new Set(scripts);
  for (const s of [...seen]) {
    const code = readFileSync(join(dist, s), 'utf8');
    for (const m of code.matchAll(/from"\.\/([^"]+\.js)"/g)) seen.add(`_astro/${m[1]}`);
    for (const m of code.matchAll(/import"\.\/([^"]+\.js)"/g)) seen.add(`_astro/${m[1]}`);
  }
  return [...seen].reduce((s, f) => s + gz(join(dist, f)), 0);
}
check('JS: home', pageJs('index.html'), BUDGET.jsHome);
check('JS: collection', pageJs('rugs.html'), BUDGET.jsHome);
check('JS: product', pageJs('rugs/sample-vintage-oushak-faded-coral-sage.html'), BUDGET.jsProduct);
const fonts = readdirSync(join(dist, 'fonts')).reduce(
  (s, f) => s + statSync(join(dist, 'fonts', f)).size,
  0,
);
check('Fonts', fonts, BUDGET.fonts);
check(
  'Hero poster (placeholder)',
  statSync(join(dist, 'placeholders', 'sample-hero-poster.svg')).size,
  BUDGET.heroPoster,
);
const critical = [
  ...readFileSync(join(dist, 'index.html'), 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g),
].reduce((s, m) => s + gzipSync(m[1]).length, 0);
check('Inline critical CSS (home)', critical, 20 * 1024);
if (failed) {
  console.error('\nBudget exceeded.');
  process.exit(1);
}
