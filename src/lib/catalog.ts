/** Build-time catalog access. Validated once; the build fails on invalid data. */
import raw from '../data/products.json';
import { CatalogSchema, type Product } from './schema';
import { SIZE_BUCKETS, STYLES, COLOR_SWATCHES } from './catalog-constants';
import { isNew } from './format';
import { site } from './site';

const parsed = CatalogSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `Invalid products.json:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
  );
}

export const products: Product[] = parsed.data;
export const byNewest = [...products].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
export const available = products.filter((p) => p.status === 'available');

export const getBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getById = (id: string) =>
  products.find((p) => p.id.toLowerCase() === id.toLowerCase());
export const productUrl = (p: Pick<Product, 'slug'>) => `/rugs/${p.slug}`;
export const productAbsUrl = (p: Pick<Product, 'slug'>) => `${site.url}${productUrl(p)}`;

export const styleLabel = (v: string) => STYLES.find((s) => s.value === v)?.label ?? v;
export const sizeBucketLabel = (v: string) => SIZE_BUCKETS.find((s) => s.value === v)?.label ?? v;
export const colorLabel = (v: string) => COLOR_SWATCHES.find((c) => c.value === v)?.label ?? v;

export function collectionMembers(collection: string): Product[] {
  switch (collection) {
    case 'new-arrivals':
      return byNewest.filter((p) => isNew(p.dateAdded));
    case 'under-1000':
      return byNewest.filter((p) => p.priceUsd < 1000);
    case 'runners':
      return byNewest.filter((p) => p.sizeBucket === 'runner');
    default:
      return byNewest.filter((p) => p.collection.includes(collection) || p.style === collection);
  }
}

/** Styles that have at least one rug (5.7). */
export const stylesInStock = STYLES.filter((s) =>
  products.some((p) => p.style === s.value && (s.value !== 'silk' || /silk/i.test(p.pileFiber))),
);

/** Similar rugs by style, size bucket and colors (7.6j). */
export function similarRugs(p: Product, n = 4): Product[] {
  return products
    .filter((q) => q.id !== p.id)
    .map((q) => {
      let score = 0;
      if (q.style === p.style) score += 3;
      if (q.sizeBucket === p.sizeBucket) score += 2;
      score += q.colors.filter((c) => p.colors.includes(c)).length;
      if (q.status === 'available') score += 1;
      return { q, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.q);
}

export const areaSqFt = (p: Product) => p.sizeFt.w * p.sizeFt.l;

/** Minimal client index (6.3) — only the fields the filter/search islands need. */
export function toIndexEntry(p: Product) {
  const front = p.images.find((i) => i.kind === 'front') ?? p.images[0]!;
  const hover = p.images.find((i) => i.kind === 'back' || i.kind === 'room') ?? p.images[1];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    style: p.style,
    styleLabel: styleLabel(p.style),
    region: p.region,
    colors: p.colors,
    sizeBucket: p.sizeBucket,
    sizeFt: p.sizeFt,
    sizeCm: p.sizeCm,
    condition: p.condition,
    construction: p.construction,
    priceUsd: p.priceUsd,
    status: p.status,
    dateAdded: p.dateAdded,
    isNew: isNew(p.dateAdded),
    image: front.id,
    imageAlt: front.alt,
    hoverImage: hover?.id ?? null,
    hoverAlt: hover?.alt ?? '',
    collection: p.collection,
    tags: p.tags ?? [],
    sample: !!p.sample,
  };
}
export type IndexEntry = ReturnType<typeof toIndexEntry>;
