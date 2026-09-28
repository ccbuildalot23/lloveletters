/** Wishlist hearts (6.7 SHOULD): localStorage, no account. */
const KEY = 'wishlist_v1';
export function getWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent('wishlist:change', { detail: ids }));
}
export function toggleWishlist(id: string): boolean {
  const ids = getWishlist();
  const i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1);
  else ids.push(id);
  save(ids);
  return i < 0;
}
export function initWishlist(root: ParentNode = document) {
  const ids = getWishlist();
  root.querySelectorAll<HTMLButtonElement>('[data-wishlist]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(ids.includes(btn.dataset.wishlist!)));
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const on = toggleWishlist(btn.dataset.wishlist!);
      btn.setAttribute('aria-pressed', String(on));
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: on ? 'Saved to your wishlist.' : 'Removed from your wishlist.',
            kind: 'info',
            timeout: 2500,
          },
        }),
      );
    });
  });
}
