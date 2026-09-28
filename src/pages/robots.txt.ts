import type { APIRoute } from 'astro';
import { site } from '@lib/site';
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/\nDisallow: /checkout/\nDisallow: /cart\nDisallow: /styleguide\nDisallow: /search\n\nSitemap: ${site.url}/sitemap-index.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
