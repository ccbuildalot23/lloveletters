#!/usr/bin/env node
/**
 * 18.2 Pulls the "Rug Catalog" Airtable base into src/data/products.json at build time.
 * Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE (default "Rugs").
 * Airtable field names mirror the schema (see README "Airtable base schema"). JSON-ish fields
 * (images, videos, colors, collection, tags) are long-text fields containing JSON.
 */
import { writeFileSync } from 'node:fs';
import { CatalogSchema } from '../src/lib/schema.ts';

const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE = 'Rugs' } = process.env;
if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.log('AIRTABLE_TOKEN / AIRTABLE_BASE_ID not set; keeping products.json as-is.');
  process.exit(0);
}

const records = [];
let offset;
do {
  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
  );
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('filterByFormula', '{publish} = 1');
  if (offset) url.searchParams.set('offset', offset);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  if (!res.ok) {
    console.error(`Airtable ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  records.push(...data.records);
  offset = data.offset;
} while (offset);

const j = (v, d) => {
  if (v === undefined || v === null || v === '') return d;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
};
const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));

const products = records.map(({ fields: f }) => ({
  id: f.id,
  slug: f.slug,
  title: f.title,
  style: f.style,
  collection: j(f.collection, [f.style]),
  condition: f.condition,
  ...(f.era ? { era: f.era } : {}),
  ...(num(f.ageYears) !== undefined ? { ageYears: num(f.ageYears) } : {}),
  sizeFt: { w: Number(f.widthFt), l: Number(f.lengthFt) },
  sizeCm: {
    w: Number(f.widthCm ?? Number(f.widthFt) * 30.48),
    l: Number(f.lengthCm ?? Number(f.lengthFt) * 30.48),
  },
  sizeBucket: f.sizeBucket,
  pileFiber: f.pileFiber,
  foundationFiber: f.foundationFiber,
  fiberContentLabel: f.fiberContentLabel,
  construction: f.construction,
  ...(f.knotType ? { knotType: f.knotType } : {}),
  ...(num(f.kpsi) ? { kpsi: num(f.kpsi) } : {}),
  ...(num(f.pileHeightMm) ? { pileHeightMm: num(f.pileHeightMm) } : {}),
  dyeType: f.dyeType ?? 'unknown',
  region: f.region,
  ...(f.village ? { village: f.village } : {}),
  ...(f.workshop ? { workshop: f.workshop } : {}),
  ...(f.weaverNote ? { weaverNote: f.weaverNote } : {}),
  ...(f.sourcingNote ? { sourcingNote: f.sourcingNote } : {}),
  colors: j(f.colors, []),
  weightKg: Number(f.weightKg),
  conditionNotes: f.conditionNotes,
  priceUsd: Math.round(Number(f.priceUsd)),
  dutiesIncluded: f.dutiesIncluded !== false,
  shippingNote: f.shippingNote ?? 'Ships from Turkey in 5–8 business days, duties prepaid.',
  images: j(f.images, []),
  videos: j(f.videos, []),
  certificatePdf: f.certificatePdf ?? `/certificates/${f.id}.pdf`,
  description: f.description,
  ...(f.careLevel ? { careLevel: f.careLevel } : {}),
  tags: j(f.tags, []),
  dateAdded: (f.dateAdded ?? new Date().toISOString()).slice(0, 10),
  status: f.status ?? 'available',
  ...(f.soldAt ? { soldAt: f.soldAt } : {}),
  ...(f.seoTitle || f.seoDescription
    ? {
        seo: {
          ...(f.seoTitle ? { title: f.seoTitle } : {}),
          ...(f.seoDescription ? { description: f.seoDescription } : {}),
        },
      }
    : {}),
}));

const result = CatalogSchema.safeParse(products);
if (!result.success) {
  console.error('✖ Airtable data is invalid:');
  for (const i of result.error.issues)
    console.error(
      `  [${products[i.path[0]]?.id ?? i.path[0]}] ${i.path.slice(1).join('.')}: ${i.message}`,
    );
  process.exit(1);
}
writeFileSync(
  new URL('../src/data/products.json', import.meta.url),
  JSON.stringify(result.data, null, 2) + '\n',
);
console.log(`✔ Wrote ${result.data.length} products from Airtable`);
