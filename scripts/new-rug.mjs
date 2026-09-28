#!/usr/bin/env node
/**
 * Interactive CLI: asks each field, validates with the Zod schema, appends to products.json (18.1).
 * Usage: npm run new-rug
 */
import { createInterface } from 'node:readline/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { ProductSchema } from '../src/lib/schema.ts';
import {
  STYLES,
  REGIONS,
  SIZE_BUCKETS,
  COLOR_SWATCHES,
  DYE_TYPES,
} from '../src/lib/catalog-constants.ts';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, def) =>
  (await rl.question(`${q}${def !== undefined ? ` [${def}]` : ''}: `)).trim() || def;
const askEnum = async (q, values, def) => {
  console.log(`  options: ${values.join(', ')}`);
  let v;
  do v = await ask(q, def);
  while (!values.includes(v));
  return v;
};
const num = async (q, def) => Number(await ask(q, def));
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const file = new URL('../src/data/products.json', import.meta.url);
const products = JSON.parse(readFileSync(file, 'utf8'));
const nextId = `TR-${String(Math.max(0, ...products.map((p) => Number(p.id.slice(3)))) + 1).padStart(4, '0')}`;

console.log('\nNew rug. Press Enter to accept a default. Ctrl+C to abort.\n');
const id = await ask('Rug ID', nextId);
const title = await ask('Title (e.g. "Vintage Oushak, Faded Coral & Sage")');
const style = await askEnum(
  'Style',
  STYLES.map((s) => s.value),
  'oushak',
);
const condition = await askEnum('Condition', ['new', 'vintage', 'antique'], 'vintage');
const era = await ask('Era (e.g. "circa 1970s") or blank', '');
const ageYears = Number(await ask('Age in years (blank if unknown)', '')) || undefined;
const wFt = await num('Width feet', 5),
  wIn = await num('Width inches', 0),
  lFt = await num('Length feet', 8),
  lIn = await num('Length inches', 0);
const w = wFt + wIn / 12,
  l = lFt + lIn / 12;
const area = w * l;
const autoBucket =
  l / w >= 2.5 && w < 4
    ? 'runner'
    : SIZE_BUCKETS.find((b) => b.value !== 'runner' && area >= b.minArea && area < b.maxArea)
        ?.value;
const sizeBucket = await askEnum(
  'Size bucket',
  SIZE_BUCKETS.map((s) => s.value),
  autoBucket,
);
const construction = await askEnum('Construction', ['hand-knotted', 'flatweave'], 'hand-knotted');
const pileFiber = await ask('Pile fiber', '100% wool');
const foundationFiber = await ask('Foundation fiber', 'cotton warp and weft');
const fiberContentLabel = await ask(
  'Fiber content label (FTC)',
  `Pile: ${pileFiber}. Foundation: ${foundationFiber}. Made in Turkey.`,
);
const knotType =
  construction === 'hand-knotted'
    ? await ask('Knot type', 'symmetrical (Turkish / Ghiordes)')
    : undefined;
const kpsi =
  construction === 'hand-knotted' ? Number(await ask('KPSI', '')) || undefined : undefined;
const pileHeightMm = Number(await ask('Pile height mm (blank if n/a)', '')) || undefined;
const dyeType = await askEnum('Dye type', DYE_TYPES, 'unknown');
const region = await askEnum('Region', REGIONS, 'Uşak');
const village = (await ask('Village (blank if none)', '')) || undefined;
const workshop = (await ask('Workshop (blank if none)', '')) || undefined;
const weaverNote = (await ask('Weaver note (blank if none)', '')) || undefined;
const sourcingNote = (await ask('Your sourcing note (blank if none)', '')) || undefined;
const colors = (
  await ask(`Colors, comma-separated (${COLOR_SWATCHES.map((c) => c.value).join('/')})`, 'red,blue')
)
  .split(',')
  .map((s) => s.trim());
const weightKg = await num('Weight kg', 12);
const conditionNotes = await ask('Condition notes');
const priceUsd = await num('Price USD (integer)', 1600);
const shippingNote = await ask(
  'Shipping note',
  'Ships from Turkey in 5–8 business days, duties prepaid.',
);
const description = await ask('Description (150–300 words, markdown ok)');
const careLevel = (await ask('Care level note (blank for default)', '')) || undefined;
const tags = (await ask('Tags, comma-separated', ''))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
console.log(
  '\nImages: enter Cloudflare Images IDs. Required kinds: front, back, then at least 4 more (corner, fringe, macro, room, scale, lifestyle).',
);
const images = [];
for (const kind of [
  'front',
  'back',
  'corner',
  'corner',
  'fringe',
  'macro',
  'room',
  'scale',
  'lifestyle',
]) {
  const imgId = await ask(
    `  ${kind} image id (blank to skip${images.length < 6 ? ', need ≥6' : ''})`,
    '',
  );
  if (!imgId) continue;
  images.push({ id: imgId, alt: await ask(`  alt text for ${kind}`, `${title}, ${kind}`), kind });
}
const flipId = await ask('Flip video Stream ID');
const videos = [
  {
    streamId: flipId,
    kind: 'flip',
    poster: images.find((i) => i.kind === 'back')?.id ?? images[0]?.id ?? '',
    caption: await ask(
      'Flip caption',
      `The flip test: I turn ${id} over and count the knots on camera.`,
    ),
    transcript: await ask('Flip transcript', 'TODO transcript'),
    uploadDate: new Date().toISOString().slice(0, 10),
  },
];
const wsId = await ask('Workshop video Stream ID (blank to skip)', '');
if (wsId)
  videos.push({
    streamId: wsId,
    kind: 'workshop',
    poster: images.find((i) => i.kind === 'lifestyle')?.id ?? images[0]?.id ?? '',
    caption: await ask('Workshop caption', `The ${region} workshop where I found this one.`),
    transcript: await ask('Workshop transcript', 'TODO transcript'),
    uploadDate: new Date().toISOString().slice(0, 10),
  });

const rug = {
  id,
  slug: await ask('Slug', slugify(title)),
  title,
  style,
  collection: [
    style,
    ...(condition !== 'new' ? ['vintage'] : []),
    ...(sizeBucket === 'runner' ? ['runners'] : []),
    ...(priceUsd < 1000 ? ['under-1000'] : []),
  ],
  condition,
  ...(era ? { era } : {}),
  ...(ageYears !== undefined ? { ageYears } : {}),
  sizeFt: { w: +w.toFixed(3), l: +l.toFixed(3) },
  sizeCm: { w: Math.round(w * 30.48), l: Math.round(l * 30.48) },
  sizeBucket,
  pileFiber,
  foundationFiber,
  fiberContentLabel,
  construction,
  ...(knotType ? { knotType } : {}),
  ...(kpsi ? { kpsi } : {}),
  ...(pileHeightMm ? { pileHeightMm } : {}),
  dyeType,
  region,
  ...(village ? { village } : {}),
  ...(workshop ? { workshop } : {}),
  ...(weaverNote ? { weaverNote } : {}),
  ...(sourcingNote ? { sourcingNote } : {}),
  colors,
  weightKg,
  conditionNotes,
  priceUsd,
  dutiesIncluded: true,
  shippingNote,
  images,
  videos,
  certificatePdf: `/certificates/${id}.pdf`,
  description,
  ...(careLevel ? { careLevel } : {}),
  tags,
  dateAdded: new Date().toISOString().slice(0, 10),
  status: 'available',
};
rl.close();
const result = ProductSchema.safeParse(rug);
if (!result.success) {
  console.error('\n✖ Not saved. Fix these and run again:');
  for (const i of result.error.issues) console.error(`  ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}
products.push(result.data);
writeFileSync(file, JSON.stringify(products, null, 2) + '\n');
console.log(
  `\n✔ Added ${id} to src/data/products.json. Run \`npm run certificate -- ${id}\` and commit.`,
);
