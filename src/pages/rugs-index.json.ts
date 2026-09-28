import type { APIRoute } from 'astro';
import { products, toIndexEntry } from '@lib/catalog';

/** Prebuilt client index for filters, cart lines, and search (6.3). Only the fields the islands need. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({ generatedAt: new Date().toISOString(), rugs: products.map(toIndexEntry) }),
    {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );
