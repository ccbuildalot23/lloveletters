/**
 * Collection island (6.2–6.5): client-side filtering over server-rendered cards,
 * URL-reflected state, live facet counts, chips, mobile drawer, load-more, live status.
 */
import { track } from './analytics';
import { fetchStatus } from './cart';
import { initRangeSliders } from './range-slider';

type Card = HTMLElement & { dataset: DOMStringMap };
const PAGE = 24;
const LIST_KEYS = ['size', 'style', 'region', 'color', 'condition', 'pile'] as const;
type ListKey = (typeof LIST_KEYS)[number];
interface State {
  size: string[];
  style: string[];
  region: string[];
  color: string[];
  condition: string[];
  pile: string[];
  min?: number;
  max?: number;
  wmin?: number;
  wmax?: number;
  lmin?: number;
  lmax?: number;
  sold: boolean;
  sort: string;
  page: number;
}

const labels: Record<string, Record<string, string>> = {};

function readState(form: HTMLFormElement): State {
  const p = new URLSearchParams(location.search);
  const list = (k: string) => (p.get(k) ?? '').split(',').filter(Boolean);
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : undefined);
  const s: State = {
    size: list('size'),
    style: list('style'),
    region: list('region'),
    color: list('color'),
    condition: list('condition'),
    pile: list('pile'),
    min: num('min'),
    max: num('max'),
    wmin: num('wmin'),
    wmax: num('wmax'),
    lmin: num('lmin'),
    lmax: num('lmax'),
    sold: p.get('sold') === '1',
    sort: p.get('sort') ?? 'newest',
    page: Math.max(1, Number(p.get('page') ?? 1)),
  };
  // sync form controls
  for (const k of LIST_KEYS)
    form
      .querySelectorAll<HTMLInputElement>(`input[name=${k}]`)
      .forEach((i) => (i.checked = s[k].includes(i.value)));
  const soldInput = form.querySelector<HTMLInputElement>('input[name=sold]');
  if (soldInput) soldInput.checked = s.sold;
  return s;
}

function writeState(s: State, replace = false) {
  const p = new URLSearchParams();
  for (const k of LIST_KEYS) if (s[k].length) p.set(k, s[k].join(','));
  for (const k of ['min', 'max', 'wmin', 'wmax', 'lmin', 'lmax'] as const)
    if (s[k] !== undefined) p.set(k, String(s[k]));
  if (s.sold) p.set('sold', '1');
  if (s.sort !== 'newest') p.set('sort', s.sort);
  if (s.page > 1) p.set('page', String(s.page));
  const url = `${location.pathname}${p.toString() ? `?${p}` : ''}`;
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

function matches(card: Card, s: State, skip?: string): boolean {
  const d = card.dataset;
  if (skip !== 'size' && s.size.length && !s.size.includes(d.sizeBucket!)) return false;
  if (skip !== 'style' && s.style.length && !s.style.includes(d.style!)) return false;
  if (skip !== 'region' && s.region.length && !s.region.includes(d.region!)) return false;
  if (skip !== 'color' && s.color.length && !d.colors!.split(',').some((c) => s.color.includes(c)))
    return false;
  if (skip !== 'condition' && s.condition.length && !s.condition.includes(d.condition!))
    return false;
  if (skip !== 'pile' && s.pile.length && !s.pile.includes(d.construction!)) return false;
  const price = Number(d.price);
  if (s.min !== undefined && price < s.min) return false;
  if (s.max !== undefined && price > s.max) return false;
  const w = Number(d.w);
  const l = Number(d.l);
  if (s.wmin !== undefined && w < s.wmin) return false;
  if (s.wmax !== undefined && w > s.wmax) return false;
  if (s.lmin !== undefined && l < s.lmin) return false;
  if (s.lmax !== undefined && l > s.lmax) return false;
  if (!s.sold && d.status === 'sold') return false;
  return true;
}

const sorters: Record<string, (a: Card, b: Card) => number> = {
  newest: (a, b) => b.dataset.date!.localeCompare(a.dataset.date!),
  'price-asc': (a, b) => Number(a.dataset.price) - Number(b.dataset.price),
  'price-desc': (a, b) => Number(b.dataset.price) - Number(a.dataset.price),
  'size-asc': (a, b) => Number(a.dataset.area) - Number(b.dataset.area),
};

export function initCollection() {
  document.documentElement.classList.add('js');
  const formEl = document.querySelector<HTMLFormElement>('[data-filter-form]');
  const gridEl = document.getElementById('collection-grid');
  if (!formEl || !gridEl) return;
  const form: HTMLFormElement = formEl;
  const grid: HTMLElement = gridEl;
  const lock = JSON.parse(form.dataset.lock || '{}') as Record<string, string>;
  const cards = Array.from(grid.querySelectorAll<Card>('[data-rug-card]'));
  const countTotal = document.querySelector<HTMLElement>('[data-count-total]')!;
  const countAvail = document.querySelector<HTMLElement>('[data-count-available]')!;
  const countWrap = document.querySelector<HTMLElement>('[data-result-count]')!;
  const chips = document.querySelector<HTMLElement>('[data-chips]')!;
  const empty = document.querySelector<HTMLElement>('[data-empty]')!;
  const sortSel = document.querySelector<HTMLSelectElement>('[data-sort]')!;
  const loadWrap = document.querySelector<HTMLElement>('[data-load-more-wrap]')!;
  const loadBtn = document.querySelector<HTMLButtonElement>('[data-load-more]')!;
  const sidebar = document.querySelector<HTMLElement>('[data-filter-sidebar] > div');
  const slot = document.querySelector<HTMLElement>('[data-filter-slot]');
  const drawer = document.getElementById('filter-drawer') as HTMLDialogElement | null;
  const applyBtn = document.querySelector<HTMLElement>('[data-apply-filters]');
  const priceRange = form.querySelector<
    HTMLElement & { setRange?: (a: number, b: number) => void }
  >('[data-range][data-name=price]');
  const wRange = form.querySelector<HTMLElement & { setRange?: (a: number, b: number) => void }>(
    '[data-range][data-name=w]',
  );
  const lRange = form.querySelector<HTMLElement & { setRange?: (a: number, b: number) => void }>(
    '[data-range][data-name=l]',
  );
  const history: string[] = [];

  // Labels for chips
  form.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((i) => {
    labels[i.name] ??= {};
    labels[i.name]![i.value] =
      i.closest('label')?.querySelector('span')?.textContent?.trim() ?? i.value;
  });

  let state = readState(form);
  sortSel.value = state.sort;
  if (priceRange && (state.min !== undefined || state.max !== undefined))
    priceRange.setRange?.(
      state.min ?? Number(priceRange.dataset.min),
      state.max ?? Number(priceRange.dataset.max),
    );
  if (wRange && (state.wmin !== undefined || state.wmax !== undefined))
    wRange.setRange?.(state.wmin ?? 2, state.wmax ?? 16);
  if (lRange && (state.lmin !== undefined || state.lmax !== undefined))
    lRange.setRange?.(state.lmin ?? 2, state.lmax ?? 24);

  function render(pushUrl = true, announce = true) {
    const filtered = cards
      .filter((c) => matches(c, state))
      .sort(sorters[state.sort] ?? sorters.newest!);
    const visibleN = Math.min(filtered.length, state.page * PAGE);
    cards.forEach((c) => (c.hidden = true));
    filtered.forEach((c, i) => {
      grid.appendChild(c);
      c.hidden = i >= visibleN;
    });
    countTotal.textContent = String(filtered.length);
    countAvail.textContent = String(
      filtered.filter((c) => c.dataset.status === 'available').length,
    );
    if (announce) countWrap.setAttribute('aria-live', 'polite');
    empty.hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;
    loadWrap.hidden = visibleN >= filtered.length;
    loadBtn.textContent = `Load more (${filtered.length - visibleN} more)`;
    // facet counts
    for (const k of LIST_KEYS) {
      const attr = {
        size: 'sizeBucket',
        style: 'style',
        region: 'region',
        color: 'colors',
        condition: 'condition',
        pile: 'construction',
      }[k];
      form.querySelectorAll<HTMLElement>(`[data-facet=${k}] [data-count]`).forEach((el) => {
        const v = el.dataset.count!;
        const n = cards.filter(
          (c) =>
            matches(c, state, k) &&
            (k === 'color' ? c.dataset.colors!.split(',').includes(v) : c.dataset[attr!] === v),
        ).length;
        el.textContent = String(n);
        const input = el.closest('label')?.querySelector('input');
        if (input) input.disabled = n === 0 && !input.checked;
      });
    }
    renderChips();
    if (pushUrl) writeState(state);
    const req = document.querySelector<HTMLInputElement>('[data-criteria]');
    if (req) req.value = JSON.stringify({ ...state, lock });
    void liveStatus(filtered.slice(0, visibleN));
    const applyLabel = document.querySelector<HTMLElement>('[data-apply-filters]');
    if (applyLabel) applyLabel.textContent = `Apply (${filtered.length} rugs)`;
  }

  function renderChips() {
    chips.innerHTML = '';
    const add = (label: string, remove: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className =
        'inline-flex min-h-[36px] items-center gap-1 rounded-full bg-sand px-3 text-small text-indigo hover:bg-line';
      b.innerHTML = `${label} <span aria-hidden="true">✕</span>`;
      b.setAttribute('aria-label', `Remove filter: ${label}`);
      b.addEventListener('click', () => {
        remove();
        state.page = 1;
        render();
      });
      chips.appendChild(b);
    };
    for (const k of LIST_KEYS)
      for (const v of state[k])
        add(labels[k]?.[v] ?? v, () => (state[k] = state[k].filter((x) => x !== v)));
    if (state.min !== undefined || state.max !== undefined)
      add(`$${state.min ?? 0}–$${state.max ?? '∞'}`, () => {
        state.min = undefined;
        state.max = undefined;
        priceRange?.setRange?.(Number(priceRange.dataset.min), Number(priceRange.dataset.max));
      });
    if (state.wmin !== undefined || state.wmax !== undefined)
      add(`Width ${state.wmin ?? 2}–${state.wmax ?? 16} ft`, () => {
        state.wmin = undefined;
        state.wmax = undefined;
        wRange?.setRange?.(2, 16);
      });
    if (state.lmin !== undefined || state.lmax !== undefined)
      add(`Length ${state.lmin ?? 2}–${state.lmax ?? 24} ft`, () => {
        state.lmin = undefined;
        state.lmax = undefined;
        lRange?.setRange?.(2, 24);
      });
    if (state.sold) add('Showing sold', () => (state.sold = false));
    if (chips.children.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'text-small text-madder underline underline-offset-4';
      clear.textContent = 'Clear all';
      clear.addEventListener('click', clearAll);
      chips.appendChild(clear);
    }
  }

  function clearAll() {
    state = {
      size: [],
      style: [],
      region: [],
      color: [],
      condition: [],
      pile: [],
      sold: false,
      sort: state.sort,
      page: 1,
    };
    form
      .querySelectorAll<HTMLInputElement>('input[type=checkbox]')
      .forEach((i) => (i.checked = false));
    priceRange?.setRange?.(Number(priceRange.dataset.min), Number(priceRange.dataset.max));
    wRange?.setRange?.(2, 16);
    lRange?.setRange?.(2, 24);
    form
      .querySelectorAll<HTMLElement>('[data-price-chip]')
      .forEach((c) => c.setAttribute('aria-pressed', 'false'));
    render();
  }

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.type !== 'checkbox') return;
    if (t.name === 'sold') state.sold = t.checked;
    else if ((LIST_KEYS as readonly string[]).includes(t.name)) {
      const k = t.name as ListKey;
      state[k] = t.checked ? [...state[k], t.value] : state[k].filter((v) => v !== t.value);
      history.push(k);
    }
    state.page = 1;
    render();
    track('filter_apply', {
      filter_type: t.name,
      value: t.value,
      result_count: Number(countTotal.textContent),
    });
  });
  form.addEventListener('range:change', (e) => {
    const el = e.target as HTMLElement;
    const { min, max } = (e as CustomEvent).detail as { min: number; max: number };
    const name = el.dataset.name;
    if (name === 'price') {
      state.min = min > Number(el.dataset.min) ? min : undefined;
      state.max = max < Number(el.dataset.max) ? max : undefined;
      form
        .querySelectorAll<HTMLElement>('[data-price-chip]')
        .forEach((c) =>
          c.setAttribute(
            'aria-pressed',
            String(
              Number(c.dataset.min) === (state.min ?? 0) && Number(c.dataset.max) === state.max,
            ),
          ),
        );
    } else if (name === 'w') {
      state.wmin = min > 2 ? min : undefined;
      state.wmax = max < 16 ? max : undefined;
    } else if (name === 'l') {
      state.lmin = min > 2 ? min : undefined;
      state.lmax = max < 24 ? max : undefined;
    }
    history.push(name!);
    state.page = 1;
    render();
    track('filter_apply', {
      filter_type: name,
      value: `${min}-${max}`,
      result_count: Number(countTotal.textContent),
    });
  });
  form.querySelectorAll<HTMLElement>('[data-price-chip]').forEach((c) =>
    c.addEventListener('click', () => {
      priceRange?.setRange?.(Number(c.dataset.min), Number(c.dataset.max));
      priceRange?.dispatchEvent(
        new CustomEvent('range:change', {
          detail: { min: Number(c.dataset.min), max: Number(c.dataset.max) },
          bubbles: true,
        }),
      );
    }),
  );
  form.querySelector('[data-clear-all]')?.addEventListener('click', clearAll);
  document.querySelector('[data-clear-all-empty]')?.addEventListener('click', clearAll);
  document.querySelector('[data-clear-last]')?.addEventListener('click', () => {
    const last = history.pop();
    if (!last) return clearAll();
    if ((LIST_KEYS as readonly string[]).includes(last)) {
      state[last as ListKey] = [];
      form
        .querySelectorAll<HTMLInputElement>(`input[name=${last}]`)
        .forEach((i) => (i.checked = false));
    } else if (last === 'price') {
      state.min = state.max = undefined;
      priceRange?.setRange?.(Number(priceRange.dataset.min), Number(priceRange.dataset.max));
    } else if (last === 'w') {
      state.wmin = state.wmax = undefined;
      wRange?.setRange?.(2, 16);
    } else if (last === 'l') {
      state.lmin = state.lmax = undefined;
      lRange?.setRange?.(2, 24);
    }
    state.page = 1;
    render();
  });
  sortSel.addEventListener('change', () => {
    state.sort = sortSel.value;
    render();
  });
  loadBtn.addEventListener('click', () => {
    state.page += 1;
    render();
    const first = cards.find((c) => !c.hidden && Number(c.dataset.pos ?? 0) === 0);
    first?.querySelector<HTMLElement>('a')?.focus();
  });
  window.addEventListener('popstate', () => {
    state = readState(form);
    sortSel.value = state.sort;
    render(false);
  });

  // Mobile drawer: move the single form into the drawer while open (one source of truth).
  if (drawer && slot && sidebar) {
    drawer.addEventListener('dialog:open', () => slot.appendChild(form));
    drawer.addEventListener('close', () => sidebar.appendChild(form));
    applyBtn?.addEventListener('click', () => drawer.close());
  }

  // Unit toggle for range labels
  form.querySelectorAll<HTMLButtonElement>('[data-unit-toggle] button').forEach((b) =>
    b.addEventListener('click', () => {
      const cm = b.dataset.unit === 'cm';
      form
        .querySelectorAll<HTMLElement>(
          '[data-range][data-name=w] legend, [data-range][data-name=l] legend',
        )
        .forEach(
          (lg) =>
            (lg.textContent = `${lg.textContent!.replace(/ \(.*\)$/, '')} (${cm ? 'cm' : 'ft'})`),
        );
      form
        .querySelectorAll<HTMLInputElement>(
          '[data-range][data-name=w] input[type=number], [data-range][data-name=l] input[type=number]',
        )
        .forEach((i) => (i.title = cm ? `≈ ${Math.round(Number(i.value) * 30.48)} cm` : ''));
    }),
  );

  initRangeSliders(form);
  render(false, false);
  track('view_item_list', {
    list_name: grid.dataset.listName,
    item_ids: cards.filter((c) => !c.hidden).map((c) => c.dataset.rugId),
  });
}

async function liveStatus(cards: Card[]) {
  const ids = cards.map((c) => c.dataset.rugId!);
  const live = await fetchStatus(ids);
  for (const c of cards) {
    const s = live[c.dataset.rugId!];
    if (!s || s === c.dataset.status) continue;
    c.dataset.status = s;
    c.classList.toggle('is-sold', s === 'sold');
    const badges = c.querySelector<HTMLElement>('[data-badges]');
    if (badges) {
      badges
        .querySelectorAll('[data-badge="one-of-one"],[data-badge="sold"],[data-badge="reserved"]')
        .forEach((b) => b.remove());
      const b = document.createElement('span');
      b.className = `badge inline-flex items-center rounded-input px-2 py-0.5 text-caption font-medium uppercase tracking-wide ${s === 'sold' ? 'bg-charcoal text-white' : s === 'reserved' ? 'bg-white text-indigo border border-indigo' : 'bg-indigo text-ivory'}`;
      b.dataset.badge = s === 'available' ? 'one-of-one' : s;
      b.textContent = s === 'sold' ? 'Sold' : s === 'reserved' ? 'In someone’s cart' : 'One of one';
      badges.prepend(b);
    }
  }
}
