import { site } from './site';

export type ImageVariant = 'thumb' | 'card' | 'gallery' | 'zoom' | 'og' | 'blur';
export const VARIANT_WIDTHS: Record<ImageVariant, number> = {
  thumb: 400,
  card: 800,
  gallery: 1600,
  zoom: 2800,
  og: 1200,
  blur: 40,
};

/**
 * Cloudflare Images delivery URL (2.5).
 * Sample data uses ids that start with "sample-"; those resolve to local placeholder SVGs
 * so the site renders without a Cloudflare account.
 */
export function imageUrl(id: string, variant: ImageVariant = 'card'): string {
  if (id.startsWith('http')) return id;
  if (id.startsWith('sample-') || site.cfImagesHash === 'PLACEHOLDER_HASH') {
    return `/placeholders/${id}.svg`;
  }
  return `https://imagedelivery.net/${site.cfImagesHash}/${id}/${variant}`;
}

/** srcset across variants, with `sizes` supplied by the caller. */
export function imageSrcset(
  id: string,
  variants: ImageVariant[] = ['thumb', 'card', 'gallery'],
): string {
  if (id.startsWith('sample-') || site.cfImagesHash === 'PLACEHOLDER_HASH') return '';
  return variants.map((v) => `${imageUrl(id, v)} ${VARIANT_WIDTHS[v]}w`).join(', ');
}
