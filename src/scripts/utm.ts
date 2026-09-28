/** 15.4 UTM capture: first landing → sessionStorage, attached to forms and checkout. */
const KEY = 'utm_ctx';
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'ttclid',
];

export interface UtmContext {
  landing: string;
  referrer: string;
  ts: string;
  [k: string]: string;
}

export function captureUtm() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(location.search);
    const ctx: UtmContext = {
      landing: location.pathname + location.search,
      referrer: document.referrer,
      ts: new Date().toISOString(),
    };
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) ctx[k] = v.slice(0, 200);
    }
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* storage unavailable */
  }
}

export function getUtmContext(): UtmContext | Record<string, never> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}
