/**
 * Single track() helper that fans out to GA4, Meta Pixel, and (via Functions) CAPI (15.3).
 * - Marketing tags load after first interaction or 3s, never when GPC/DNT is set or consent denied (15.2).
 * - ?debug_analytics=1 logs every event to the console (15.5).
 * - Cloudflare Web Analytics is cookieless and injected by BaseLayout independently.
 */
export type EventName =
  | 'page_view'
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'filter_apply'
  | 'search'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'checkout_blocked'
  | 'purchase'
  | 'generate_lead'
  | 'trade_apply'
  | 'book_call'
  | 'video_play'
  | 'video_complete'
  | 'gallery_back_view'
  | 'unit_toggle';

type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      loaded?: boolean;
      callMethod?: unknown;
    };
    _fbq?: unknown;
    __analyticsConfig?: { ga4Id?: string; pixelId?: string; consentBanner?: boolean };
  }
}

const metaMap: Partial<Record<EventName, string>> = {
  page_view: 'PageView',
  view_item: 'ViewContent',
  search: 'Search',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  generate_lead: 'Lead',
  trade_apply: 'Lead',
  book_call: 'Schedule',
};

let debug = false;
let marketingAllowed = false;
let loaded = false;
const queue: Array<[EventName, Params]> = [];

function gpcOrDnt(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return (
    nav.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
  );
}

function consentOk(): boolean {
  const cfg = window.__analyticsConfig ?? {};
  if (gpcOrDnt()) return false;
  if (!cfg.consentBanner) return true;
  try {
    return localStorage.getItem('consent_marketing') === 'granted';
  } catch {
    return false;
  }
}

function loadTags() {
  if (loaded || !marketingAllowed) return;
  loaded = true;
  const cfg = window.__analyticsConfig ?? {};
  if (cfg.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', cfg.ga4Id, { send_page_view: false });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4Id)}`;
    document.head.appendChild(s);
  }
  if (cfg.pixelId && !window.fbq) {
    const f = function (...args: unknown[]) {
      if (f.callMethod) (f.callMethod as (...a: unknown[]) => void).apply(f, args);
      else f.queue!.push(args);
    } as NonNullable<Window['fbq']>;
    f.queue = [];
    f.loaded = true;
    window.fbq = f;
    window._fbq = f;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', cfg.pixelId);
  }
  for (const [name, params] of queue.splice(0)) send(name, params);
}

function send(name: EventName, params: Params) {
  if (window.gtag) window.gtag('event', name, params);
  const metaName = metaMap[name];
  if (window.fbq && metaName) {
    const opts = params.event_id ? { eventID: String(params.event_id) } : undefined;
    const metaParams: Params = { ...params };
    if (name === 'purchase')
      Object.assign(metaParams, {
        value: params.value,
        currency: 'USD',
        content_ids: params.item_ids,
        content_type: 'product',
      });
    if (name === 'view_item' || name === 'add_to_cart')
      Object.assign(metaParams, {
        content_ids: [params.item_id],
        content_type: 'product',
        value: params.price,
        currency: 'USD',
      });
    window.fbq('track', metaName, metaParams, opts);
  }
}

export function track(name: EventName, params: Params = {}) {
  const payload = { ...params, path: location.pathname };
  if (debug) console.info('[analytics]', name, payload);
  if (!marketingAllowed) return;
  if (!loaded) queue.push([name, payload]);
  else send(name, payload);
}

export function initAnalytics() {
  debug =
    new URLSearchParams(location.search).get('debug_analytics') === '1' ||
    sessionStorage.getItem('debug_analytics') === '1';
  if (debug) sessionStorage.setItem('debug_analytics', '1');
  marketingAllowed = consentOk();
  window.addEventListener('consent:change', (e) => {
    marketingAllowed = (e as CustomEvent).detail === 'granted' && !gpcOrDnt();
    if (marketingAllowed) loadTags();
  });
  const utm = Object.fromEntries(
    [...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')),
  );
  track('page_view', { referrer: document.referrer, ...utm });
  const kick = () => loadTags();
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) =>
    window.addEventListener(ev, kick, { once: true, passive: true }),
  );
  setTimeout(kick, 3000);
  // Declarative events: data-track="event" data-track-params='{"item_id":"TR-0001"}'
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]:not(form)');
    if (!el) return;
    let params: Params = {};
    try {
      params = JSON.parse(el.dataset.trackParams ?? '{}');
    } catch {
      /* ignore */
    }
    track(el.dataset.track as EventName, params);
  });
}
