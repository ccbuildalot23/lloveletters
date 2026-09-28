/** Enumerations shared by the schema, filters, forms, and scripts. */
export const STYLES = [
  { value: 'oushak', label: 'Oushak' },
  { value: 'village', label: 'Village / Tribal' },
  { value: 'kilim', label: 'Kilim (flatweave)' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'overdyed', label: 'Overdyed' },
  { value: 'modern-anatolian', label: 'Modern Anatolian' },
  { value: 'silk', label: 'Silk' }, // only shown when a rug has pileFiber including silk
] as const;
export type StyleValue = (typeof STYLES)[number]['value'];

export const REGIONS = [
  'Uşak',
  'Konya',
  'Kayseri',
  'Isparta',
  'Milas',
  'Kars',
  'Anatolian (unspecified)',
] as const;
export type RegionValue = (typeof REGIONS)[number];

export const SIZE_BUCKETS = [
  { value: 'small', label: 'Small (under 4×6)', minArea: 0, maxArea: 22 },
  { value: '4x6', label: '4×6', minArea: 22, maxArea: 33 },
  { value: '5x8', label: '5×8', minArea: 33, maxArea: 48 },
  { value: '6x9', label: '6×9', minArea: 48, maxArea: 68 },
  { value: '8x10', label: '8×10', minArea: 68, maxArea: 95 },
  { value: '9x12', label: '9×12', minArea: 95, maxArea: 125 },
  { value: '10x14+', label: '10×14 and up', minArea: 125, maxArea: Infinity },
  { value: 'runner', label: 'Runner', minArea: 0, maxArea: Infinity },
] as const;
export type SizeBucket = (typeof SIZE_BUCKETS)[number]['value'];

/** Size landing pages (4.1 /sizes/[size]) */
export const SIZE_PAGES = [
  {
    slug: '4x6',
    bucket: '4x6',
    label: '4×6 rugs',
    room: 'Entryways, bedsides, and reading nooks',
    hint: 'entry',
  },
  {
    slug: '5x8',
    bucket: '5x8',
    label: '5×8 rugs',
    room: 'Small living rooms and under a coffee table',
    hint: 'living',
  },
  {
    slug: '6x9',
    bucket: '6x9',
    label: '6×9 rugs',
    room: 'Living rooms with front legs of sofas on the rug',
    hint: 'living',
  },
  {
    slug: '8x10',
    bucket: '8x10',
    label: '8×10 rugs',
    room: 'Living and dining rooms, all furniture legs on',
    hint: 'living/dining',
  },
  {
    slug: '9x12',
    bucket: '9x12',
    label: '9×12 rugs',
    room: 'Large rooms and open plans',
    hint: 'large room',
  },
  {
    slug: 'runner',
    bucket: 'runner',
    label: 'Runners',
    room: 'Hallways, kitchens, and stairs',
    hint: 'hall',
  },
] as const;

export const COLOR_SWATCHES = [
  { value: 'ivory', label: 'Ivory', hex: '#F3EDE1' },
  { value: 'beige', label: 'Beige', hex: '#D9C6A5' },
  { value: 'red', label: 'Red', hex: '#9E2B25' },
  { value: 'rust', label: 'Rust', hex: '#B5552B' },
  { value: 'blue', label: 'Blue', hex: '#3E5A86' },
  { value: 'green', label: 'Green', hex: '#6B7B4B' },
  { value: 'gold', label: 'Gold', hex: '#D9A441' },
  { value: 'pink', label: 'Pink', hex: '#E0A3A0' },
  { value: 'gray', label: 'Gray', hex: '#8D8A85' },
  {
    value: 'multi',
    label: 'Multi',
    hex: 'conic-gradient(#9E2B25,#D9A441,#6B7B4B,#3E5A86,#9E2B25)',
  },
] as const;
export type ColorValue = (typeof COLOR_SWATCHES)[number]['value'];

export const CONDITIONS = [
  { value: 'new', label: 'New (0–5 yrs)' },
  { value: 'vintage', label: 'Semi-antique / vintage (20–50 yrs)' },
  { value: 'antique', label: 'Antique (100+ yrs)' },
] as const;

export const CONSTRUCTIONS = [
  { value: 'hand-knotted', label: 'Pile (hand-knotted)' },
  { value: 'flatweave', label: 'Flatweave' },
] as const;

export const DYE_TYPES = ['natural', 'synthetic', 'mixed', 'unknown'] as const;

export const COLLECTIONS: Record<string, { title: string; intro: string; description: string }> = {
  oushak: {
    title: 'Oushak rugs',
    intro:
      'Soft palettes, large-scale motifs, and a low, glossy wool pile from the Uşak region. The rug most people picture when they say "Turkish rug."',
    description:
      'One-of-a-kind hand-knotted Oushak rugs from Uşak, Turkey. Filmed at the source, duties included, 30-day returns.',
  },
  vintage: {
    title: 'Vintage rugs',
    intro:
      'Twenty to fifty years of use, honestly described. Faded fields, even low pile, and condition notes with photos of every repair.',
    description:
      'Vintage hand-knotted Turkish rugs with full condition reports and back-of-rug videos.',
  },
  kilim: {
    title: 'Kilims',
    intro:
      'Flatwoven, reversible, and lighter than pile rugs. Geometric Anatolian patterns from Konya, Milas, and Kars.',
    description: 'Hand-woven Turkish kilims. One of one, verified at the loom.',
  },
  runners: {
    title: 'Runners',
    intro:
      'Hallways, kitchens, and stairs. Narrow pieces two to three feet wide and eight to twelve feet long.',
    description: 'Hand-knotted Turkish runners for halls and kitchens.',
  },
  'new-arrivals': {
    title: 'New arrivals',
    intro: 'Just in from the loom. Everything added in the last three weeks.',
    description: 'The latest one-of-a-kind Turkish rugs added to the collection.',
  },
  'under-1000': {
    title: 'Rugs under $1,000',
    intro: 'Smaller pieces and kilims. Same verification, same duties-included price.',
    description: 'Hand-knotted and flatwoven Turkish rugs under $1,000.',
  },
  village: {
    title: 'Village & tribal rugs',
    intro:
      'Woven at home rather than in a workshop. Bolder color, irregular drawing, and a lot of character.',
    description: 'Turkish village and tribal rugs from Konya, Kars, and central Anatolia.',
  },
  overdyed: {
    title: 'Overdyed rugs',
    intro:
      'Vintage pieces re-dyed in a single saturated color. The old pattern shows through the new tone.',
    description: 'Overdyed vintage Turkish rugs in indigo, madder, and charcoal.',
  },
  'modern-anatolian': {
    title: 'Modern Anatolian rugs',
    intro:
      'New rugs woven today in traditional workshops, in palettes designed for contemporary rooms.',
    description: 'New hand-knotted Anatolian rugs in modern colorways.',
  },
};

export const POPULAR_SEARCHES = [
  '8x10 Oushak',
  'runner',
  'vintage',
  'kilim',
  'blue',
  'under $1,000',
];
