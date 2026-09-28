/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { products } from '@lib/catalog';
import { productJsonLd, faqJsonLd, organizationJsonLd, websiteJsonLd } from '@lib/jsonld';

describe('Product JSON-LD (14.5)', () => {
  for (const p of products) {
    it(`${p.id} has a valid Product + Offer + shipping + return policy shape`, () => {
      const ld = productJsonLd(p) as Record<string, any>;
      expect(ld['@context']).toBe('https://schema.org');
      expect(ld['@type']).toBe('Product');
      expect(ld.name).toBeTruthy();
      expect(ld.name).not.toMatch(/SAMPLE ·/);
      expect(ld.sku).toBe(p.id);
      expect(Array.isArray(ld.image) && ld.image.length >= 6).toBe(true);
      expect(ld.brand?.['@type']).toBe('Brand');
      expect(ld.material).toBe(p.pileFiber);
      expect(ld.countryOfOrigin).toBe('TR');
      expect(['https://schema.org/NewCondition', 'https://schema.org/UsedCondition']).toContain(
        ld.itemCondition,
      );
      const o = ld.offers;
      expect(o['@type']).toBe('Offer');
      expect(o.priceCurrency).toBe('USD');
      expect(o.price).toBe(p.priceUsd);
      expect(o.availability).toBe(
        p.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      );
      expect(o.seller?.name).toBeTruthy();
      expect(o.shippingDetails.shippingDestination.addressCountry).toBe('US');
      expect(o.shippingDetails.shippingRate.value).toBe(0);
      expect(o.hasMerchantReturnPolicy.merchantReturnDays).toBe(30);
      expect(o.hasMerchantReturnPolicy.applicableCountry).toBe('US');
      expect(ld.aggregateRating).toBeUndefined(); // no fake ratings
    });
  }
  it('adds aggregateRating only with ≥3 real reviews', () => {
    const p = products[0]!;
    expect(
      (productJsonLd(p, { rating: { value: 5, count: 2 } }) as any).aggregateRating,
    ).toBeUndefined();
    expect(
      (productJsonLd(p, { rating: { value: 4.7, count: 3 } }) as any).aggregateRating.reviewCount,
    ).toBe(3);
  });
});

describe('Other JSON-LD', () => {
  it('FAQPage shape', () => {
    const ld = faqJsonLd([{ q: 'Q?', a: 'A.' }]) as any;
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('A.');
  });
  it('Organization and WebSite', () => {
    expect((organizationJsonLd() as any).contactPoint[0].telephone).toBeTruthy();
    expect((websiteJsonLd() as any).potentialAction['@type']).toBe('SearchAction');
  });
});
