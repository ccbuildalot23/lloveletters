/** Client search over /search-index.json with MiniSearch (typo tolerance, prefix). */
import type MiniSearch from 'minisearch';
import { track } from './analytics';

interface Doc {
  id: string;
  type: 'rug' | 'guide';
  title: string;
  slug?: string;
  href?: string;
  style?: string;
  region?: string;
  colors?: string;
  size?: string;
  tags?: string;
  summary?: string;
  status?: string;
  priceUsd?: number;
  image?: string;
  condition?: string;
}

let index: MiniSearch<Doc> | null = null;
let docs: Doc[] = [];
let loading: Promise<void> | null = null;

export function loadIndex(): Promise<void> {
  if (index) return Promise.resolve();
  if (loading) return loading;
  loading = Promise.all([
    fetch('/search-index.json').then((r) => r.json() as Promise<{ rugs: Doc[]; guides: Doc[] }>),
    import('minisearch'),
  ]).then(([data, mod]) => {
    const MS = mod.default;
    docs = [...data.rugs, ...data.guides];
    index = new MS<Doc>({
      fields: ['title', 'style', 'region', 'colors', 'size', 'tags', 'summary', 'id', 'condition'],
      storeFields: [
        'type',
        'title',
        'slug',
        'href',
        'style',
        'region',
        'size',
        'status',
        'priceUsd',
        'image',
        'summary',
        'id',
      ],
      searchOptions: { boost: { title: 3, id: 5, style: 2 }, fuzzy: 0.2, prefix: true },
    });
    index.addAll(docs);
  });
  return loading;
}

export function search(q: string, limits = { rugs: 6, guides: 3 }) {
  if (!index) return { rugs: [] as Doc[], guides: [] as Doc[], exactRug: null as Doc | null };
  const idMatch = q.trim().match(/^tr-?\s?(\d{1,4})$/i);
  const exactRug = idMatch
    ? (docs.find((d) => d.type === 'rug' && d.id === `TR-${idMatch[1]!.padStart(4, '0')}`) ?? null)
    : null;
  const hits = index.search(q) as unknown as Doc[];
  return {
    rugs: hits.filter((h) => h.type === 'rug').slice(0, limits.rugs),
    guides: hits.filter((h) => h.type === 'guide').slice(0, limits.guides),
    exactRug,
  };
}

function priceHtml(d: Doc) {
  if ((window as unknown as { __launchMode?: string }).__launchMode === 'waitlist')
    return '<span class="text-stone">Price at launch</span>';
  if (d.status === 'sold') return '<span class="text-stone">Sold</span>';
  return `<span class="tnum font-medium text-indigo">$${(d.priceUsd ?? 0).toLocaleString('en-US')}</span>`;
}

function render(
  container: HTMLElement,
  q: string,
  res: ReturnType<typeof search>,
  status: HTMLElement,
) {
  const { rugs, guides } = res;
  const total = rugs.length + guides.length;
  if (!q.trim()) {
    container.innerHTML = '';
    status.textContent = '';
    return;
  }
  if (!total) {
    container.innerHTML = `<p class="rounded-card bg-sand p-4 text-small text-charcoal" role="option" aria-selected="false">No rugs match “${escapeHtml(q)}”. Try a size like “8x10”, a style like “Oushak”, or a color.</p>`;
    status.textContent = `No results for ${q}`;
    return;
  }
  const rugItems = rugs
    .map(
      (
        d,
        i,
      ) => `<li><a role="option" id="sr-${i}" aria-selected="false" href="/rugs/${d.slug}" class="search-result flex items-center gap-3 rounded-card p-2 no-underline hover:bg-sand aria-selected:bg-sand" data-result>
        <img src="${imgUrl(d.image!)}" alt="" width="56" height="70" class="aspect-[4/5] w-14 rounded object-cover bg-sand" loading="lazy" />
        <span class="flex-1"><span class="block text-body font-medium text-indigo">${escapeHtml(d.title)}</span><span class="block text-small text-stone">${escapeHtml(d.style ?? '')} · ${escapeHtml(d.region ?? '')} · ${escapeHtml((d.size ?? '').split(' ')[0] + ' ' + (d.size ?? '').split(' ').slice(1, 3).join(' '))}</span></span>
        ${priceHtml(d)}</a></li>`,
    )
    .join('');
  const guideItems = guides
    .map(
      (
        d,
        i,
      ) => `<li><a role="option" id="sr-g${i}" aria-selected="false" href="${d.href}" class="search-result flex items-start gap-3 rounded-card p-2 no-underline hover:bg-sand aria-selected:bg-sand" data-result>
        <span class="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded bg-sand text-indigo" aria-hidden="true">📖</span>
        <span><span class="block text-body font-medium text-indigo">${escapeHtml(d.title)}</span><span class="block text-small text-stone">${escapeHtml(d.summary ?? '')}</span></span></a></li>`,
    )
    .join('');
  container.innerHTML = `${rugs.length ? `<p class="mb-1 text-caption font-semibold uppercase tracking-wide text-stone">Rugs</p><ul>${rugItems}</ul>` : ''}${guides.length ? `<p class="mt-3 mb-1 text-caption font-semibold uppercase tracking-wide text-stone">Guides</p><ul>${guideItems}</ul>` : ''}<p class="mt-3 text-small"><a href="/search?q=${encodeURIComponent(q)}">See all results for “${escapeHtml(q)}”</a></p>`;
  status.textContent = `${total} results for ${q}`;
}

function imgUrl(id: string) {
  const hash = (document.documentElement.dataset.cfImages ?? '') || '';
  return id.startsWith('sample-') || !hash
    ? `/placeholders/${id}.svg`
    : `https://imagedelivery.net/${hash}/${id}/thumb`;
}
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

export function initSearchOverlay() {
  const dialog = document.getElementById('search-overlay') as HTMLDialogElement | null;
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]')!;
  const results = dialog.querySelector<HTMLElement>('[data-search-results]')!;
  const empty = dialog.querySelector<HTMLElement>('[data-search-empty]')!;
  const status = dialog.querySelector<HTMLElement>('[data-search-status]')!;
  const form = dialog.querySelector<HTMLFormElement>('[data-search-form]')!;
  let active = -1;
  let debounce: number | undefined;

  const options = () => Array.from(results.querySelectorAll<HTMLAnchorElement>('[role=option]'));
  const setActive = (i: number) => {
    const opts = options();
    active = opts.length ? ((i % opts.length) + opts.length) % opts.length : -1;
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === active)));
    input.setAttribute('aria-activedescendant', active >= 0 ? (opts[active]!.id ?? '') : '');
    opts[active]?.scrollIntoView({ block: 'nearest' });
  };

  const run = () => {
    const q = input.value;
    const res = search(q);
    if (res.exactRug) {
      window.location.assign(`/rugs/${res.exactRug.slug}`);
      return;
    }
    render(results, q, res, status);
    empty.hidden = !!q.trim();
    input.setAttribute('aria-expanded', String(!!q.trim()));
    active = -1;
  };

  dialog.addEventListener('dialog:open', () => {
    void loadIndex().then(run);
    input.focus();
  });
  input.addEventListener('focus', () => void loadIndex(), { once: true });
  input.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void loadIndex().then(run), 80);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      options()[active]?.click();
    }
  });
  form.addEventListener('submit', () => {
    track('search', { search_term: input.value, result_count: options().length });
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-search-suggest]').forEach((b) =>
    b.addEventListener('click', () => {
      input.value = b.dataset.searchSuggest!;
      void loadIndex().then(run);
      input.focus();
    }),
  );
  // Keyboard shortcut "/" opens search
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) &&
      !dialog.open
    ) {
      e.preventDefault();
      dialog.showModal();
      dialog.dispatchEvent(new CustomEvent('dialog:open'));
    }
  });
}
