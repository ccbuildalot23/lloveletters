/** 14.3 Google Merchant Center RSS 2.0 feed with the g: namespace. */
import type { APIRoute } from 'astro';
import { products, productAbsUrl, colorLabel, styleLabel } from '@lib/catalog';
import { imageUrl } from '@lib/images';
import { sizeFt } from '@lib/format';
import { site } from '@lib/site';

const esc = (s: string) =>
  s.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!,
  );
const abs = (id: string, v: 'gallery' | 'card' = 'gallery') => {
  const u = imageUrl(id, v);
  return u.startsWith('http') ? u : `${site.url}${u}`;
};

export const GET: APIRoute = () => {
  const items = products
    .map((p) => {
      const images = p.images.map((i) => abs(i.id));
      const title = p.title.replace('SAMPLE · ', '');
      return `<item>
  <g:id>${esc(p.id)}</g:id>
  <title>${esc(`${title} · ${sizeFt(p.sizeFt.w, p.sizeFt.l)} hand-knotted Turkish rug`)}</title>
  <description>${esc(p.description.replace(/\[SAMPLE DATA[^\]]*\]\s*/, '').slice(0, 4900))}</description>
  <link>${esc(productAbsUrl(p))}</link>
  <g:image_link>${esc(images[0]!)}</g:image_link>
${images
  .slice(1, 11)
  .map((u) => `  <g:additional_image_link>${esc(u)}</g:additional_image_link>`)
  .join('\n')}
  <g:availability>${p.status === 'available' ? 'in_stock' : 'out_of_stock'}</g:availability>
  <g:price>${p.priceUsd}.00 USD</g:price>
  <g:condition>${p.condition === 'new' ? 'new' : 'used'}</g:condition>
  <g:brand>${esc(site.name)}</g:brand>
  <g:google_product_category>Home &amp; Garden &gt; Decor &gt; Rugs</g:google_product_category>
  <g:product_type>${esc(`Rugs > ${styleLabel(p.style)}`)}</g:product_type>
  <g:material>${esc(p.pileFiber)}</g:material>
  <g:color>${esc(p.colors.map(colorLabel).join('/'))}</g:color>
  <g:size>${esc(sizeFt(p.sizeFt.w, p.sizeFt.l))}</g:size>
  <g:shipping><g:country>US</g:country><g:service>Insured express, duties included</g:service><g:price>0.00 USD</g:price></g:shipping>
  <g:shipping_weight>${p.weightKg} kg</g:shipping_weight>
  <g:identifier_exists>no</g:identifier_exists>
  <g:custom_label_0>${esc(p.region)}</g:custom_label_0>
</item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(site.name)}</title>
<link>${esc(site.url)}</link>
<description>${esc(site.description)}</description>
${items}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
