#!/usr/bin/env node
/**
 * 18.5 Certificate generator: npm run certificate -- TR-0042 [--all]
 * Branded PDF with rug ID, photo (JPG/PNG if reachable; placeholder block otherwise), facts,
 * signature line, and a QR code to the product page. Output: public/certificates/<ID>.pdf
 *
 * Runs in `npm run build` (after validate-catalog, before astro build) so dist/ carries one PDF per
 * rug. Photos are fetched only from an explicit allowlist (Cloudflare Images for this account's hash,
 * images.unsplash.com for the SAMPLE catalog), with a timeout, a size cap, a content-type check, and
 * no redirect following. CERTIFICATE_SKIP_FETCH=true skips network entirely (deterministic CI builds).
 * Rugs marked `sample: true` get a SAMPLE RECORD statement instead of the verification statement:
 * a generated PDF never authenticates a rug, and nothing here adds facts the catalog lacks.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

const products = JSON.parse(
  readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'),
);
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://provenantrugs.com').replace(/\/$/, '');
const brand = process.env.PUBLIC_BRAND_NAME || 'Provenant Rugs';
const dealer = process.env.PUBLIC_DEALER_NAME || 'Provenant Rugs LLC';
const hash = process.env.CF_IMAGES_HASH || '';
const args = process.argv.slice(2);
const targets = args.includes('--all')
  ? products
  : products.filter((p) => args.map((a) => a.toUpperCase()).includes(p.id));
if (!targets.length) {
  console.error('Usage: npm run certificate -- TR-0042 [TR-0043 …] | --all');
  process.exit(1);
}
const outDir = new URL('../public/certificates/', import.meta.url);
mkdirSync(outDir, { recursive: true });
if (args.includes('--all')) {
  // The generator owns this directory: drop PDFs for rugs that left the catalog.
  const keep = new Set(products.map((p) => `${p.id}.pdf`));
  for (const f of readdirSync(outDir))
    if (f.endsWith('.pdf') && !keep.has(f)) unlinkSync(new URL(f, outDir));
}
const SKIP_FETCH = process.env.CERTIFICATE_SKIP_FETCH === 'true';
const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

/** Resolves a catalog image id to an allowlisted URL, or null when it is not fetchable. */
function imageUrl(id) {
  if (!id || id.startsWith('sample-') || id.startsWith('placeholder')) return null;
  if (id.startsWith('https://images.unsplash.com/'))
    return `${id.split('?')[0]}?auto=format&fit=max&q=75&w=800&fm=jpg`;
  if (/^[A-Za-z0-9_-]+$/.test(id) && hash) return `https://imagedelivery.net/${hash}/${id}/card`;
  return null;
}

/** Fetches an allowlisted image with a deadline, a byte cap, and no redirects. Returns null on any problem. */
async function fetchImage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!/^image\/(jpeg|png)/.test(type)) return null;
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return null;
    return { buf, png: type.includes('png') };
  } catch {
    return null;
  }
}
const ftIn = (ft) => {
  const w = Math.floor(ft);
  let i = Math.round((ft - w) * 12);
  let f = w;
  if (i === 12) {
    f++;
    i = 0;
  }
  return i ? `${f}' ${i}"` : `${f}'`;
};
const IVORY = rgb(0.965, 0.945, 0.914),
  INDIGO = rgb(0.137, 0.224, 0.357),
  MADDER = rgb(0.62, 0.169, 0.145),
  CHARCOAL = rgb(0.169, 0.169, 0.169),
  STONE = rgb(0.43, 0.416, 0.392),
  SAND = rgb(0.914, 0.875, 0.812);

for (const p of targets) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifI = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: IVORY });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: 564,
    height: 744,
    borderColor: INDIGO,
    borderWidth: 1.5,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 552,
    height: 732,
    borderColor: MADDER,
    borderWidth: 0.5,
  });
  draw(page, brand, { x: 54, y: 712, size: 26, font: serif, color: INDIGO });
  draw(
    page,
    p.sample
      ? 'SAMPLE RECORD · not a certificate'
      : 'Provenance Report · Certificate of Authenticity',
    { x: 54, y: 684, size: 14, font: sans, color: MADDER },
  );
  draw(page, `Rug ID ${p.id}`, { x: 420, y: 712, size: 14, font: sansB, color: INDIGO });

  // Photo
  const front = p.images.find((i) => i.kind === 'front') ?? p.images[0];
  let drewImage = false;
  const url = SKIP_FETCH ? null : imageUrl(front?.id);
  const fetched = url ? await fetchImage(url) : null;
  if (fetched) {
    try {
      const img = fetched.png ? await pdf.embedPng(fetched.buf) : await pdf.embedJpg(fetched.buf);
      const s = Math.min(220 / img.width, 275 / img.height);
      page.drawImage(img, { x: 54, y: 390, width: img.width * s, height: img.height * s });
      drewImage = true;
    } catch {
      /* fall through to the placeholder block */
    }
  }
  if (!drewImage) {
    page.drawRectangle({
      x: 54,
      y: 390,
      width: 220,
      height: 275,
      color: SAND,
      borderColor: INDIGO,
      borderWidth: 1,
    });
    draw(page, 'Rug photo', { x: 120, y: 525, size: 12, font: sans, color: STONE });
    draw(page, url ? '(photo not fetched at build time)' : '(no fetchable photo id)', {
      x: 78,
      y: 508,
      size: 8,
      font: sans,
      color: STONE,
    });
  }

  // Facts
  const facts = [
    ['Title', p.title.replace('SAMPLE · ', '')],
    ['Style', p.style],
    ['Condition', `${p.condition}${p.era ? ` (${p.era})` : ''}`],
    [
      'Size',
      `${ftIn(p.sizeFt.w)} × ${ftIn(p.sizeFt.l)}  ·  ${Math.round(p.sizeCm.w)} × ${Math.round(p.sizeCm.l)} cm`,
    ],
    ['Pile', p.pileFiber],
    ['Foundation', p.foundationFiber],
    ['Construction', p.construction],
    ...(p.knotType ? [['Knot', p.knotType]] : []),
    ...(p.kpsi ? [['KPSI', String(p.kpsi)]] : []),
    ['Dyes', p.dyeType],
    ['Region', `${p.region}${p.village ? ` · ${p.village}` : ''}`],
    ['Weight', `${p.weightKg} kg`],
    ['Origin', 'Made in Turkey (imported)'],
    ['Verified on', p.dateAdded],
  ];
  let y = 660;
  for (const [k, v] of facts) {
    draw(page, k, { x: 300, y, size: 9, font: sansB, color: STONE });
    const lines = wrap(String(v), 38);
    for (const line of lines) {
      draw(page, line, { x: 380, y, size: 10, font: sans, color: CHARCOAL });
      y -= 13;
    }
    y -= 4;
  }
  // Condition notes
  draw(page, 'Condition notes', { x: 54, y: 360, size: 9, font: sansB, color: STONE });
  let cy = 346;
  for (const line of wrap(p.conditionNotes, 95)) {
    draw(page, line, { x: 54, y: cy, size: 9.5, font: sans, color: CHARCOAL });
    cy -= 12;
  }
  // Statement
  const statement = p.sample
    ? `SAMPLE RECORD. This document shows the certificate layout for a placeholder catalog entry (${p.id}). No rug was inspected, the photo is stock imagery, and nothing on this page is a statement about a real rug. Real certificates are issued only for rugs ${dealer} has verified in person.`
    : `I, Chris, verified this rug in person: I flipped it, counted the knots, checked the fibers and dyes, and measured it twice. The details above match the product page at ${siteUrl}/rugs/${p.slug}. If an independent appraiser finds this rug is not as described, ${dealer} will refund the purchase in full, including return shipping.`;
  let sy = cy - 16;
  for (const line of wrap(statement, 100)) {
    draw(page, line, { x: 54, y: sy, size: 9.5, font: serifI, color: INDIGO });
    sy -= 12.5;
  }
  // Signature line + QR
  page.drawLine({
    start: { x: 54, y: 110 },
    end: { x: 300, y: 110 },
    thickness: 0.8,
    color: CHARCOAL,
  });
  draw(page, 'Signature', { x: 54, y: 96, size: 8, font: sans, color: STONE });
  draw(page, `${dealer}  ·  ${siteUrl.replace(/^https?:\/\//, '')}`, {
    x: 54,
    y: 60,
    size: 8,
    font: sans,
    color: STONE,
  });
  const sigPath = new URL('../public/signature.png', import.meta.url);
  if (existsSync(sigPath)) {
    const sig = await pdf.embedPng(readFileSync(sigPath));
    page.drawImage(sig, { x: 60, y: 114, width: 140, height: 46 });
  }
  const qr = await QRCode.toBuffer(`${siteUrl}/rugs/${p.slug}?ref=cert`, { margin: 0, width: 220 });
  const qrImg = await pdf.embedPng(qr);
  page.drawImage(qrImg, { x: 470, y: 60, width: 88, height: 88 });
  draw(page, 'Scan for the flip video', { x: 452, y: 48, size: 7.5, font: sans, color: STONE });
  writeFileSync(new URL(`${p.id}.pdf`, outDir), await pdf.save());
  console.log(`✔ public/certificates/${p.id}.pdf`);
}

/**
 * The built-in PDF fonts are WinAnsi-only, so Turkish letters (ş, ğ, ı, İ) cannot be encoded.
 * Try the exact text first; on failure, transliterate those letters and strip anything else
 * WinAnsi cannot carry, so a place name like Uşak renders as Usak instead of aborting the build.
 */
function draw(page, text, opts) {
  const str = String(text);
  try {
    page.drawText(str, opts);
  } catch {
    const safe = str
      .replace(/[şŞğĞıİ]/g, (c) => ({ ş: 's', Ş: 'S', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I' })[c])
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e\xa0-\xff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026]/g, '?');
    page.drawText(safe, opts);
  }
}

function wrap(text, max) {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) {
      out.push(line.trim());
      line = word;
    } else line += ' ' + word;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}
