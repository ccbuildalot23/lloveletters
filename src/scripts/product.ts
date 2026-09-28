/** Product page island: live status, Buy now, share, recently viewed, view_item event. */
import { track } from './analytics';
import { fetchStatus, startCheckout } from './cart';
import { toast } from './toast';

const RECENT_KEY = 'recently_viewed_v1';

export function initProduct() {
  const panel = document.querySelector<HTMLElement>('[data-purchase]');
  if (!panel) return;
  const id = panel.dataset.rugId!;
  const price = Number(document.querySelector<HTMLElement>('[data-buy-now]')?.dataset.price ?? 0);
  track('view_item', { item_id: id, price, style: panel.dataset.style, size: panel.dataset.size });

  // Recently viewed
  try {
    const list = (JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]).filter(
      (x) => x !== id,
    );
    list.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* noop */
  }

  // Live availability
  const applyStatus = (status: string) => {
    if (status === panel.dataset.status) return;
    panel.dataset.status = status;
    const text = panel.querySelector<HTMLElement>('[data-availability-text]');
    const dot = panel.querySelector<HTMLElement>('[data-availability] span');
    if (text)
      text.textContent =
        status === 'available'
          ? 'Available — one of one'
          : status === 'reserved'
            ? 'In someone’s cart — check back in 30 min'
            : 'Sold';
    if (dot)
      dot.className = `size-2.5 rounded-full ${status === 'available' ? 'bg-olive' : status === 'reserved' ? 'bg-saffron' : 'bg-charcoal'}`;
    panel
      .querySelector<HTMLElement>('[data-cta-available]')
      ?.toggleAttribute('hidden', status !== 'available');
    panel
      .querySelector<HTMLElement>('[data-cta-reserved]')
      ?.toggleAttribute('hidden', status !== 'reserved');
    panel
      .querySelector<HTMLElement>('[data-cta-sold]')
      ?.toggleAttribute('hidden', status !== 'sold');
    document.querySelector<HTMLElement>('[data-sticky-bar]')?.setAttribute('data-status', status);
  };
  const refresh = async () => {
    const live = await fetchStatus([id]);
    if (live[id]) applyStatus(live[id]!);
  };
  void refresh();
  document.addEventListener(
    'visibilitychange',
    () => document.visibilityState === 'visible' && void refresh(),
  );

  // Buy now (7.4 #8): straight to checkout
  document.querySelectorAll<HTMLButtonElement>('[data-buy-now]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const err = panel.querySelector<HTMLElement>('[data-buy-error]');
      err?.classList.add('hidden');
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = `<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span> ${btn.dataset.loadingText}`;
      const res = await startCheckout([id]);
      if (res.ok) return void window.location.assign(res.url);
      btn.innerHTML = label;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (res.status === 409) {
        const st = res.unavailable?.[0]?.status ?? 'reserved';
        applyStatus(st);
        toast(
          st === 'sold'
            ? 'Just sold. Here are similar rugs below.'
            : 'Someone’s checking out with this rug right now. We’ll hold your spot: get notified below.',
          'error',
          7000,
        );
        if (st === 'sold')
          document.getElementById('similar')?.scrollIntoView({ behavior: 'smooth' });
      } else if (res.status === 503 && err) {
        err.textContent = `Checkout is temporarily unavailable. Text us at ${document.documentElement.dataset.phone ?? 'the number below'} to reserve this rug.`;
        err.classList.remove('hidden');
      } else if (err) {
        err.textContent =
          res.message === 'network'
            ? 'Couldn’t reach checkout — check your connection and try again.'
            : 'Couldn’t start checkout. Please try again.';
        err.classList.remove('hidden');
      }
    }),
  );

  // Share (7.8)
  document.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const url = location.href;
      const title = document.title;
      if (btn.dataset.share === 'native' && 'share' in navigator) {
        try {
          await navigator.share({ title, url });
        } catch {
          /* cancelled */
        }
        return;
      }
      if (btn.dataset.share === 'copy') {
        try {
          await navigator.clipboard.writeText(url);
          toast('Link copied.', 'success', 2500);
        } catch {
          toast('Couldn’t copy. Long-press the address bar instead.', 'error');
        }
      }
    }),
  );
  if ('share' in navigator)
    document.querySelector<HTMLElement>('[data-share="native"]')?.classList.remove('hidden');

  // Recently viewed rail
  const rail = document.querySelector<HTMLElement>('[data-recent]');
  if (rail) {
    try {
      const ids = (JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[])
        .filter((x) => x !== id)
        .slice(0, 4);
      if (ids.length) {
        void fetch('/rugs-index.json')
          .then(
            (r) =>
              r.json() as Promise<{
                rugs: Array<{
                  id: string;
                  slug: string;
                  title: string;
                  image: string;
                  imageAlt: string;
                  priceUsd: number;
                  status: string;
                }>;
              }>,
          )
          .then((data) => {
            const hash = document.documentElement.dataset.cfImages || '';
            const img = (i: string) =>
              i.startsWith('sample-') || !hash
                ? `/placeholders/${i}.svg`
                : `https://imagedelivery.net/${hash}/${i}/card`;
            const items = ids
              .map((i) => data.rugs.find((r) => r.id === i))
              .filter(Boolean) as typeof data.rugs;
            if (!items.length) return;
            rail.querySelector('ul')!.innerHTML = items
              .map(
                (r) =>
                  `<li><a href="/rugs/${r.slug}" class="group block no-underline"><img src="${img(r.image)}" alt="${r.imageAlt.replace(/"/g, '&quot;')}" width="400" height="500" loading="lazy" class="aspect-[4/5] w-full rounded-card bg-sand object-cover${r.status === 'sold' ? ' grayscale-[30%]' : ''}" /><span class="mt-2 block text-small font-medium text-indigo group-hover:underline">${r.title.replace('SAMPLE · ', '')}</span></a></li>`,
              )
              .join('');
            rail.hidden = false;
          });
      }
    } catch {
      /* noop */
    }
  }
}
