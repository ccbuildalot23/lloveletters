/**
 * Generates placeholder SVGs in public/placeholders for every sample image id,
 * plus hero/founder/room placeholders. Real media comes from Cloudflare Images.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { COLOR_SWATCHES } from '../src/lib/catalog-constants.ts';

const out = new URL('../public/placeholders/', import.meta.url);
mkdirSync(out, { recursive: true });
const products = JSON.parse(
  readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'),
);
const hex = (c) => COLOR_SWATCHES.find((s) => s.value === c)?.hex ?? '#D9C6A5';

function rugSvg({ w, h, colors, label, kind }) {
  const [c1, c2 = '#F3EDE1', c3 = '#23395B'] = colors
    .map(hex)
    .map((c) => (c.startsWith('conic') ? '#9E2B25' : c));
  const border = Math.round(Math.min(w, h) * 0.08);
  const motif =
    kind === 'back'
      ? `<pattern id="k" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${c1}"/><rect x="1" y="1" width="6" height="6" fill="${c2}" opacity=".7"/><rect x="7" y="7" width="6" height="6" fill="${c3}" opacity=".5"/></pattern>`
      : `<pattern id="k" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="${c1}"/><path d="M60 10l50 50-50 50-50-50z" fill="${c2}" opacity=".85"/><circle cx="60" cy="60" r="16" fill="${c3}" opacity=".8"/></pattern>`;
  const room = kind === 'room' || kind === 'lifestyle';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${motif}</defs>
<rect width="${w}" height="${h}" fill="${room ? '#EDE6DA' : '#F6F1E9'}"/>
${room ? `<rect x="0" y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="#D8CFC0"/><rect x="${w * 0.2}" y="${h * 0.52}" width="${w * 0.6}" height="${h * 0.32}" fill="url(#k)" transform="skewX(-8)"/><rect x="${w * 0.1}" y="${h * 0.3}" width="${w * 0.35}" height="${h * 0.25}" rx="12" fill="#E9DFCF" stroke="#D8CFC0"/>` : `<rect x="${border}" y="${border}" width="${w - border * 2}" height="${h - border * 2}" fill="${c3}"/><rect x="${border * 2}" y="${border * 2}" width="${w - border * 4}" height="${h - border * 4}" fill="url(#k)"/>`}
<g font-family="Inter, Arial, sans-serif" text-anchor="middle"><rect x="${w / 2 - 170}" y="${h / 2 - 34}" width="340" height="68" rx="8" fill="#2B2B2B" opacity=".82"/><text x="${w / 2}" y="${h / 2 - 6}" font-size="26" fill="#F6F1E9" font-weight="600">SAMPLE IMAGE</text><text x="${w / 2}" y="${h / 2 + 22}" font-size="20" fill="#D9A441">${label}</text></g></svg>`;
}

let n = 0;
for (const p of products) {
  for (const img of p.images) {
    const w = img.width ?? 1600;
    const h = img.height ?? 2000;
    writeFileSync(
      new URL(`${img.id}.svg`, out),
      rugSvg({ w, h, colors: p.colors, label: `${p.id} · ${img.kind}`, kind: img.kind }),
    );
    n++;
  }
}
const extras = {
  'sample-hero-poster': {
    w: 1920,
    h: 1080,
    colors: ['red', 'gold', 'blue'],
    label: 'Hero poster · hands at the loom',
    kind: 'room',
  },
  'sample-founder': {
    w: 1200,
    h: 1500,
    colors: ['blue', 'beige', 'ivory'],
    label: 'Chris at a workshop',
    kind: 'room',
  },
  'sample-signature': {
    w: 600,
    h: 200,
    colors: ['ivory', 'ivory', 'ivory'],
    label: 'Signature',
    kind: 'front',
  },
  'sample-og-default': {
    w: 1200,
    h: 630,
    colors: ['red', 'ivory', 'blue'],
    label: 'Real Turkish rugs. Verified at the loom.',
    kind: 'front',
  },
  'sample-map-turkey': {
    w: 1200,
    h: 600,
    colors: ['beige', 'ivory', 'blue'],
    label: 'Sourcing map',
    kind: 'room',
  },
  'sample-room-1': {
    w: 1600,
    h: 900,
    colors: ['pink', 'green', 'ivory'],
    label: 'Customer room 1',
    kind: 'room',
  },
  'sample-room-2': {
    w: 1600,
    h: 900,
    colors: ['ivory', 'gray', 'blue'],
    label: 'Customer room 2',
    kind: 'room',
  },
  'sample-room-3': {
    w: 1600,
    h: 900,
    colors: ['red', 'blue', 'ivory'],
    label: 'Customer room 3',
    kind: 'room',
  },
  'sample-workshop-1': {
    w: 1600,
    h: 1200,
    colors: ['rust', 'ivory', 'gold'],
    label: 'Workshop 1',
    kind: 'room',
  },
  'sample-workshop-2': {
    w: 1600,
    h: 1200,
    colors: ['blue', 'ivory', 'red'],
    label: 'Workshop 2',
    kind: 'room',
  },
  'sample-workshop-3': {
    w: 1600,
    h: 1200,
    colors: ['green', 'gold', 'red'],
    label: 'Workshop 3',
    kind: 'room',
  },
  'sample-guide-knots': {
    w: 1600,
    h: 900,
    colors: ['red', 'ivory', 'blue'],
    label: 'Knot diagram',
    kind: 'back',
  },
};
for (const [id, o] of Object.entries(extras)) {
  writeFileSync(new URL(`${id}.svg`, out), rugSvg({ ...o, label: o.label }));
  n++;
}
console.log(`Wrote ${n} placeholder SVGs`);
