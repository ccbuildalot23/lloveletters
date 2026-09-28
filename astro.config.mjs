// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Site URL comes from the environment so previews (Cloudflare Pages sets CF_PAGES_URL)
 * and production ([DOMAIN]) both get correct canonicals and sitemaps.
 */
import { readFileSync } from 'node:fs';

/** Sold rugs stay indexed for SOLD_INDEX_DAYS (default 90), then drop out of the sitemap (14.1). */
const soldIndexDays = Number(process.env.SOLD_INDEX_DAYS || 90);
const staleSold = new Set(
  JSON.parse(readFileSync(new URL('./src/data/products.json', import.meta.url), 'utf8'))
    .filter(
      (p) =>
        p.status === 'sold' &&
        p.soldAt &&
        Date.now() - new Date(p.soldAt).getTime() > soldIndexDays * 86400000,
    )
    .map(
      (p) =>
        `${(process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'https://provenantrugs.com').replace(/\/$/, '')}/rugs/${p.slug}`,
    ),
);

const site = process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'https://provenantrugs.com'; // [DOMAIN] — replace via PUBLIC_SITE_URL

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
  },
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/(admin|styleguide|checkout|cart|search|500|404)(\/|$)/.test(page) &&
        !staleSold.has(page),
      serialize: (item) => {
        if (/\/rugs\//.test(item.url)) return { ...item, changefreq: 'weekly', priority: 0.8 };
        if (/\/(collections|sizes)\//.test(item.url) || /\/rugs$/.test(item.url))
          return { ...item, changefreq: 'daily', priority: 0.9 };
        return { ...item, changefreq: 'monthly', priority: 0.5 };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep chunk names stable and readable for the budget checker.
      rollupOptions: {
        output: { manualChunks: undefined },
      },
    },
  },
});
