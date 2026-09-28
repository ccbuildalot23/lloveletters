/**
 * Product schema (Section 7.1). The build fails on invalid data (validate-catalog runs first).
 * Kept dependency-light so Node scripts can import it directly (node strips types).
 */
import { z } from 'zod';
import {
  COLOR_SWATCHES,
  CONSTRUCTIONS,
  DYE_TYPES,
  REGIONS,
  SIZE_BUCKETS,
  STYLES,
} from './catalog-constants.ts';

const styleValues = STYLES.map((s) => s.value) as [string, ...string[]];
const sizeBucketValues = SIZE_BUCKETS.map((s) => s.value) as [string, ...string[]];
const colorValues = COLOR_SWATCHES.map((c) => c.value) as [string, ...string[]];
const constructionValues = CONSTRUCTIONS.map((c) => c.value) as [string, ...string[]];

export const ImageSchema = z.object({
  id: z.string().min(1),
  alt: z.string().min(8),
  kind: z.enum([
    'front',
    'back',
    'corner',
    'fringe',
    'macro',
    'room',
    'scale',
    'lifestyle',
    'detail',
  ]),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const VideoSchema = z.object({
  streamId: z.string().min(1),
  kind: z.enum(['flip', 'walkthrough', 'workshop']),
  poster: z.string().min(1),
  caption: z.string().min(1),
  transcript: z.string().min(1),
  durationSec: z.number().positive().optional(),
  uploadDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/)
    .optional(),
});

const Dim = z.object({ w: z.number().positive(), l: z.number().positive() });

export const ProductSchema = z
  .object({
    id: z.string().regex(/^TR-\d{4}$/, 'id must look like TR-0042'),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-hyphenated'),
    title: z.string().min(6).max(90),
    style: z.enum(styleValues),
    collection: z.array(z.string()).min(1),
    condition: z.enum(['new', 'vintage', 'antique']),
    ageYears: z.number().int().nonnegative().optional(),
    era: z.string().optional(),
    sizeFt: Dim,
    sizeCm: Dim,
    sizeBucket: z.enum(sizeBucketValues),
    pileFiber: z.string().min(3),
    foundationFiber: z.string().min(3),
    fiberContentLabel: z.string().min(10),
    construction: z.enum(constructionValues),
    knotType: z.string().optional(),
    kpsi: z.number().int().positive().optional(),
    pileHeightMm: z.number().positive().optional(),
    dyeType: z.enum(DYE_TYPES),
    region: z.enum(REGIONS),
    village: z.string().optional(),
    workshop: z.string().optional(),
    weaverNote: z.string().optional(),
    sourcingNote: z.string().optional(),
    colors: z.array(z.enum(colorValues)).min(1).max(3),
    weightKg: z.number().positive(),
    conditionNotes: z.string().min(10),
    priceUsd: z.number().int().positive(),
    dutiesIncluded: z.boolean(),
    shippingNote: z.string().min(5),
    images: z.array(ImageSchema).min(6),
    videos: z.array(VideoSchema).min(1),
    certificatePdf: z.string().min(1),
    description: z.string().min(400).max(2600), // ~150–300 words
    careLevel: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateAdded: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
    status: z.enum(['available', 'reserved', 'sold']),
    soldAt: z.string().optional(),
    seo: z
      .object({ title: z.string().max(60).optional(), description: z.string().max(155).optional() })
      .optional(),
    sample: z.boolean().optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if ('compareAtUsd' in p)
      ctx.addIssue({ code: 'custom', message: 'compareAtUsd is forbidden (no fake "was" prices)' });
    if (p.ageYears === undefined && !p.era)
      ctx.addIssue({ code: 'custom', path: ['era'], message: 'Provide ageYears or era' });
    if (!p.videos.some((v) => v.kind === 'flip'))
      ctx.addIssue({
        code: 'custom',
        path: ['videos'],
        message: 'At least one flip (back-of-rug) video is required',
      });
    const kinds = new Set(p.images.map((i) => i.kind));
    for (const req of ['front', 'back'] as const)
      if (!kinds.has(req))
        ctx.addIssue({
          code: 'custom',
          path: ['images'],
          message: `Missing required ${req} image`,
        });
    if (p.style === 'silk' && !/silk/i.test(p.pileFiber))
      ctx.addIssue({
        code: 'custom',
        path: ['style'],
        message: 'style "silk" requires pileFiber to include silk',
      });
    const banned = /\b(silk)\b/i;
    if (!/silk/i.test(p.pileFiber) && (banned.test(p.title) || banned.test(p.description))) {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'The word "silk" is banned unless pileFiber includes silk',
      });
    }
    if (/\binvestment\b/i.test(p.description))
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: '"investment" claims are banned',
      });
    if (p.construction === 'flatweave' && p.style !== 'kilim' && p.kpsi)
      ctx.addIssue({ code: 'custom', path: ['kpsi'], message: 'flatweaves have no KPSI' });
    const areaFt = p.sizeFt.w * p.sizeFt.l;
    const ratio = p.sizeFt.l / p.sizeFt.w;
    const bucket = SIZE_BUCKETS.find((b) => b.value === p.sizeBucket)!;
    if (p.sizeBucket === 'runner') {
      if (ratio < 2.5)
        ctx.addIssue({
          code: 'custom',
          path: ['sizeBucket'],
          message: 'runner requires length ≥ 2.5× width',
        });
    } else if (areaFt < bucket.minArea || areaFt >= bucket.maxArea) {
      ctx.addIssue({
        code: 'custom',
        path: ['sizeBucket'],
        message: `sizeBucket ${p.sizeBucket} does not match area ${areaFt.toFixed(1)} sq ft`,
      });
    }
    const cmW = p.sizeFt.w * 30.48;
    if (Math.abs(cmW - p.sizeCm.w) > 3)
      ctx.addIssue({
        code: 'custom',
        path: ['sizeCm'],
        message: 'sizeCm.w does not match sizeFt.w',
      });
  });

export const CatalogSchema = z.array(ProductSchema).superRefine((list, ctx) => {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  list.forEach((p, i) => {
    if (ids.has(p.id))
      ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate id ${p.id}` });
    if (slugs.has(p.slug))
      ctx.addIssue({ code: 'custom', path: [i, 'slug'], message: `duplicate slug ${p.slug}` });
    ids.add(p.id);
    slugs.add(p.slug);
  });
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductImage = z.infer<typeof ImageSchema>;
export type ProductVideo = z.infer<typeof VideoSchema>;
export type RugStatus = Product['status'];
