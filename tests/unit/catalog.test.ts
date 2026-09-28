import { describe, expect, it } from 'vitest';
import { ProductSchema, CatalogSchema } from '@lib/schema';
import { products, similarRugs, collectionMembers, toIndexEntry } from '@lib/catalog';
import { feetInches, sizeFt, slugify } from '@lib/format';

describe('catalog schema (7.1)', () => {
  it('sample catalog is valid', () => {
    expect(CatalogSchema.safeParse(products).success).toBe(true);
  });
  it('rejects compareAtUsd', () => {
    const p = { ...products[0]!, compareAtUsd: 2000 };
    const r = ProductSchema.safeParse(p);
    expect(r.success).toBe(false);
  });
  it('rejects "silk" in copy when pileFiber has no silk', () => {
    const p = { ...products[0]!, description: products[0]!.description + ' Pure silk pile.' };
    expect(ProductSchema.safeParse(p).success).toBe(false);
  });
  it('rejects investment claims', () => {
    const p = { ...products[0]!, description: products[0]!.description + ' A great investment.' };
    expect(ProductSchema.safeParse(p).success).toBe(false);
  });
  it('requires a flip video and front/back images', () => {
    const p = { ...products[0]!, videos: products[0]!.videos.filter((v) => v.kind !== 'flip') };
    expect(ProductSchema.safeParse(p).success).toBe(false);
  });
  it('rejects duplicate ids', () => {
    expect(
      CatalogSchema.safeParse([products[0], { ...products[1]!, id: products[0]!.id }]).success,
    ).toBe(false);
  });
  it('validates sizeBucket against area', () => {
    const p = { ...products[0]!, sizeBucket: '9x12' as const };
    expect(ProductSchema.safeParse(p).success).toBe(false);
  });
});

describe('catalog helpers', () => {
  it('similarRugs excludes self and returns up to n', () => {
    const s = similarRugs(products[0]!, 4);
    expect(s.length).toBeLessThanOrEqual(4);
    expect(s.every((r) => r.id !== products[0]!.id)).toBe(true);
  });
  it('collectionMembers handles virtual collections', () => {
    expect(collectionMembers('under-1000').every((p) => p.priceUsd < 1000)).toBe(true);
    expect(collectionMembers('runners').every((p) => p.sizeBucket === 'runner')).toBe(true);
  });
  it('index entry keeps only needed fields', () => {
    const e = toIndexEntry(products[0]!);
    expect(e).not.toHaveProperty('description');
    expect(e).toHaveProperty('priceUsd');
  });
});

describe('format', () => {
  it('feetInches', () => {
    expect(feetInches(5.167)).toBe('5′ 2″');
    expect(feetInches(8)).toBe('8′');
    expect(feetInches(7.99)).toBe('8′');
    expect(sizeFt(2.667, 9.833)).toBe('2′ 8″ × 9′ 10″');
  });
  it('slugify', () =>
    expect(slugify('Vintage Oushak, Faded Coral & Sage')).toBe('vintage-oushak-faded-coral-sage'));
});
