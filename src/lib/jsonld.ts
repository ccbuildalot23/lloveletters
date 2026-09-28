/** JSON-LD builders (14.2). */
import { site } from './site';
import type { Product } from './schema';
import { productAbsUrl, styleLabel, colorLabel } from './catalog';
import { imageUrl } from './images';
import { sizeFt } from './format';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#org`,
    name: site.name,
    legalName: site.dealerName,
    url: site.url,
    logo: `${site.url}/favicon.svg`,
    sameAs: Object.values(site.social),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.phone,
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: 'en',
        email: site.email,
      },
    ],
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressCountry: 'US' },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productJsonLd(
  p: Product,
  opts: { rating?: { value: number; count: number } } = {},
) {
  const url = productAbsUrl(p);
  const images = p.images.map((i) =>
    imageUrl(i.id, 'gallery').startsWith('http')
      ? imageUrl(i.id, 'gallery')
      : `${site.url}${imageUrl(i.id, 'gallery')}`,
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.title.replace('SAMPLE · ', ''),
    description: p.description.replace(/\[SAMPLE DATA[^\]]*\]\s*/, '').slice(0, 500),
    sku: p.id,
    productID: p.id,
    image: images,
    brand: { '@type': 'Brand', name: site.name },
    material: p.pileFiber,
    color: p.colors.map(colorLabel).join(', '),
    size: `${sizeFt(p.sizeFt.w, p.sizeFt.l)} (${Math.round(p.sizeCm.w)} × ${Math.round(p.sizeCm.l)} cm)`,
    countryOfOrigin: 'TR',
    category: 'Home & Garden > Decor > Rugs',
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Style', value: styleLabel(p.style) },
      { '@type': 'PropertyValue', name: 'Region', value: p.region },
      { '@type': 'PropertyValue', name: 'Construction', value: p.construction },
      ...(p.kpsi ? [{ '@type': 'PropertyValue', name: 'KPSI', value: p.kpsi }] : []),
    ],
    itemCondition:
      p.condition === 'new'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url,
      price: p.priceUsd,
      priceCurrency: 'USD',
      availability:
        p.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      itemCondition:
        p.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      seller: { '@type': 'Organization', name: site.dealerName },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 10, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: site.returnsDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnShippingFees',
      },
    },
    ...(opts.rating && opts.rating.count >= 3
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: opts.rating.value,
            reviewCount: opts.rating.count,
          },
        }
      : {}),
  };
}

export function videoJsonLd(p: Product) {
  return p.videos
    .filter((v) => v.kind === 'flip' || v.kind === 'workshop')
    .map((v) => ({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: `${v.kind === 'flip' ? 'Flip test' : 'Workshop'}: ${p.title.replace('SAMPLE · ', '')}`,
      description: v.caption,
      thumbnailUrl: imageUrl(v.poster, 'gallery').startsWith('http')
        ? imageUrl(v.poster, 'gallery')
        : `${site.url}${imageUrl(v.poster, 'gallery')}`,
      uploadDate: v.uploadDate ?? p.dateAdded,
      contentUrl: `https://videodelivery.net/${v.streamId}/manifest/video.m3u8`,
      embedUrl: `https://iframe.videodelivery.net/${v.streamId}`,
      ...(v.durationSec ? { duration: `PT${Math.round(v.durationSec)}S` } : {}),
    }));
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function collectionJsonLd(name: string, url: string, products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: productAbsUrl(p),
        name: p.title.replace('SAMPLE · ', ''),
      })),
    },
  };
}
