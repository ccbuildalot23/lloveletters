import { SIZE_PAGES, STYLES, REGIONS } from './catalog-constants';
import { slugify } from './format';

export const mainNav = [
  { label: 'Shop rugs', href: '/rugs', mega: true },
  { label: 'Authenticity', href: '/authenticity' },
  { label: 'About', href: '/about' },
  { label: 'Trade', href: '/trade' },
];

export const megaColumns = [
  {
    title: 'By size',
    links: SIZE_PAGES.map((s) => ({ label: s.label, href: `/sizes/${s.slug}` })),
  },
  {
    title: 'By style',
    links: STYLES.filter((s) => s.value !== 'silk').map((s) => ({
      label: s.label,
      href: `/collections/${s.value}`,
    })),
  },
  {
    title: 'By region',
    links: REGIONS.filter((r) => !r.includes('unspecified')).map((r) => ({
      label: r,
      href: `/rugs?region=${encodeURIComponent(r)}`,
    })),
  },
  {
    title: 'Featured',
    links: [
      { label: 'New arrivals', href: '/collections/new-arrivals' },
      { label: 'Under $1,000', href: '/collections/under-1000' },
      { label: 'Runners', href: '/collections/runners' },
      { label: 'All rugs', href: '/rugs' },
    ],
  },
];

export const footerColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All rugs', href: '/rugs' },
      { label: 'New arrivals', href: '/collections/new-arrivals' },
      { label: 'Oushak', href: '/collections/oushak' },
      { label: 'Vintage', href: '/collections/vintage' },
      { label: 'Kilims', href: '/collections/kilim' },
      { label: 'Runners', href: '/collections/runners' },
      { label: 'Book a live look', href: '/book' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping & duties', href: '/shipping-duties' },
      { label: 'Returns', href: '/returns' },
      { label: 'Care guide', href: '/care' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Authenticity', href: '/authenticity' },
      { label: 'Trade program', href: '/trade' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  },
];

export const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Accessibility', href: '/accessibility' },
];

export const regionSlug = (r: string) => slugify(r);
