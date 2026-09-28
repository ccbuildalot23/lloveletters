/**
 * Custom brand icons (3.6): knot/loom, flip test, certificate, duties-included,
 * returns, US support. 24x24 viewBox, 1.5px stroke, currentColor.
 */
const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const customIcons: Record<string, string> = {
  knot: wrap(
    '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/><path d="M7 4v16M12 4v16M17 4v16"/><circle cx="9.5" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9.5" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  ),
  loom: wrap(
    '<path d="M3 4v16M21 4v16"/><path d="M3 7h18M3 17h18"/><path d="M6 7v10M9 7v10M12 7v10M15 7v10M18 7v10"/><path d="M4 12h16" stroke-dasharray="1.5 1.5"/>',
  ),
  flip: wrap(
    '<path d="M4 5h11a4 4 0 0 1 4 4v10"/><path d="M4 5l3-3M4 5l3 3"/><path d="M20 19l-3 3M20 19l-3-3"/><rect x="7" y="9" width="8" height="10" rx="1"/><path d="M9 12h4M9 15h4"/>',
  ),
  certificate: wrap(
    '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M7 8h10M7 11h6"/><circle cx="16" cy="14" r="2"/><path d="M14.5 16v5l1.5-1 1.5 1v-5"/>',
  ),
  duties: wrap(
    '<path d="M3 9l9-5 9 5v8l-9 5-9-5z"/><path d="M3 9l9 5 9-5M12 14v8"/><path d="M8.5 11.5l-1 1M15.5 6.5l-1 1"/><path d="M9 4.5l6 3.3"/>',
  ),
  returns: wrap(
    '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v5h5"/><path d="M12 8v4l2.5 1.5"/>',
  ),
  'us-support': wrap(
    '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/><path d="M12 12h9" opacity="0.5"/>',
  ),
  whatsapp: wrap(
    '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M9 9.5c0 3.5 2 5.5 5.5 5.5l1-1.5-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8z"/>',
  ),
  pinterest: wrap(
    '<circle cx="12" cy="12" r="9"/><path d="M11 21l2-8"/><path d="M9.5 12.5c-.5-1 0-3.5 2.5-3.5 2 0 3 1.5 3 3 0 2.5-1.5 4-3 4-1 0-1.5-.5-1.5-1.5"/>',
  ),
  instagram: wrap(
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
  ),
  youtube: wrap(
    '<path d="M2.5 12c0-3 .3-4.6.8-5.4.5-.8 1.4-1.1 2.7-1.2C7.7 5.2 9.7 5.1 12 5.1s4.3.1 6 .3c1.3.1 2.2.4 2.7 1.2.5.8.8 2.4.8 5.4s-.3 4.6-.8 5.4c-.5.8-1.4 1.1-2.7 1.2-1.7.2-3.7.3-6 .3s-4.3-.1-6-.3c-1.3-.1-2.2-.4-2.7-1.2-.5-.8-.8-2.4-.8-5.4z"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/>',
  ),
  tiktok: wrap('<path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.5 2 4 4.5 4.5"/>'),
  'apple-pay': wrap(
    '<path d="M7 8h10a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z"/><path d="M8 13v-2M11 13v-2M14 13v-2M17 13v-2"/>',
  ),
  'google-pay': wrap('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'),
  visa: wrap(
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14l2-4M11 10l1 4M13.5 14l1.5-4M17 10l-1 4"/>',
  ),
  mastercard: wrap(
    '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="10" cy="12" r="3"/><circle cx="14" cy="12" r="3"/>',
  ),
  amex: wrap(
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h4M13 10l4 4M17 10l-4 4"/>',
  ),
  affirm: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 15l4-7 4 7"/>'),
  klarna: wrap(
    '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 9v6M12 9c0 3-2 4-4 6M16 9l-3 3 3 3"/>',
  ),
};
