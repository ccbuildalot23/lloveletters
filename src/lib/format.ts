/** Formatting helpers: money, sizes, dates. */
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatUsd = (n: number) => (Number.isInteger(n) ? usd.format(n) : usdCents.format(n));
export const formatCents = (cents: number) => usdCents.format(cents / 100);

/** 5.17 ft → "5′ 2″" */
export function feetInches(feet: number): string {
  const whole = Math.floor(feet);
  let inches = Math.round((feet - whole) * 12);
  let ft = whole;
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  return inches ? `${ft}′ ${inches}″` : `${ft}′`;
}

export const sizeFt = (w: number, l: number) => `${feetInches(w)} × ${feetInches(l)}`;
export const sizeCm = (w: number, l: number) => `${Math.round(w)} × ${Math.round(l)} cm`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const isNew = (iso: string, days = 21) =>
  Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
