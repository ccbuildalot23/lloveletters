import type { APIRoute } from 'astro';
import { products, styleLabel, colorLabel } from '@lib/catalog';
import { sizeFt } from '@lib/format';
import { guides } from '@lib/guides';

export const GET: APIRoute = () => {
  const rugs = products.map((p) => ({
    id: p.id,
    type: 'rug',
    slug: p.slug,
    title: p.title.replace('SAMPLE · ', ''),
    style: styleLabel(p.style),
    region: p.region,
    colors: p.colors.map(colorLabel).join(' '),
    size: `${sizeFt(p.sizeFt.w, p.sizeFt.l)} ${p.sizeBucket} ${p.sizeBucket.replace('x', ' by ')}`,
    tags: (p.tags ?? []).join(' '),
    condition: p.condition,
    status: p.status,
    priceUsd: p.priceUsd,
    image: p.images[0]!.id,
  }));
  const docs = guides.map((g) => ({
    id: g.id,
    type: 'guide',
    title: g.title,
    summary: g.summary,
    tags: g.tags.join(' '),
    href: g.href,
  }));
  return new Response(JSON.stringify({ rugs, guides: docs }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
