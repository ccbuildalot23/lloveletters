#!/usr/bin/env node
/** Renders public/og-default.png (1200×630) from the brand palette with headless Chromium. Run after changing the brand. */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
const exe =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    : undefined);
const brand = process.env.PUBLIC_BRAND_NAME || 'Provenant Rugs';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url(file://${process.cwd()}/public/fonts/fraunces-latin-opsz-wght.woff2) format('woff2-variations');font-weight:100 900}
@font-face{font-family:Inter;src:url(file://${process.cwd()}/public/fonts/inter-latin-wght.woff2) format('woff2-variations');font-weight:100 900}
body{margin:0;width:1200px;height:630px;background:#F6F1E9;font-family:Inter,sans-serif;color:#23395B;position:relative;overflow:hidden}
.band{position:absolute;right:0;top:0;bottom:0;width:420px;background:#23395B}
.knot{position:absolute;right:110px;top:165px}
h1{font-family:Fraunces,serif;font-weight:500;font-size:84px;line-height:1.05;margin:0;letter-spacing:-.01em;font-variation-settings:'opsz' 72}
h1 em{font-style:italic;font-weight:400;color:#9E2B25}
.tag{margin-top:26px;font-size:30px;font-weight:500;color:#9E2B25;letter-spacing:.08em;text-transform:uppercase}
.sub{margin-top:34px;font-size:26px;color:#2B2B2B;max-width:640px;line-height:1.4}
.wrap{position:absolute;left:80px;top:150px;width:660px}
.rule{position:absolute;left:80px;bottom:70px;width:660px;height:2px;background:#D8CFC0}
.foot{position:absolute;left:80px;bottom:34px;font-size:18px;color:#6E6A64;letter-spacing:.04em}
</style></head><body>
<div class="band"></div>
<svg class="knot" width="200" height="200" viewBox="0 0 32 32"><path d="M10 3v26M22 3v26" stroke="#F6F1E9" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M5 20c0-5 4-7 8-7h6c4 0 8 2 8 7" stroke="#D9A441" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M13 13c-2 0-3-2-3-4M19 13c2 0 3-2 3-4" stroke="#D9A441" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M16 13v-9" stroke="#D9A441" stroke-width="3" stroke-linecap="round"/><path d="M16 20c-3 0-5 3-5 6M16 20c3 0 5 3 5 6" stroke="#D9A441" stroke-width="3" stroke-linecap="round" fill="none"/></svg>
<div class="wrap"><h1>Provenant <em>Rugs</em></h1><div class="tag">Verified at the Loom</div><div class="sub">One-of-a-kind hand-knotted Turkish rugs, flipped on camera before I buy them. Duties included. 30-day returns.</div></div>
<div class="rule"></div><div class="foot">provenantrugs.com</div>
</body></html>`;
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'public/og-default.png', type: 'png' });
await b.close();
console.log(`✔ public/og-default.png (${brand})`);
