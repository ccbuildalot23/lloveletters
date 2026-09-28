/**
 * Wires every <dialog> modal/drawer: open/close triggers, backdrop click, Esc,
 * focus return to the trigger (13.4), and body scroll lock.
 */
let lastTrigger: HTMLElement | null = null;

function openDialog(dialog: HTMLDialogElement, trigger?: HTMLElement) {
  if (dialog.open) return;
  lastTrigger = trigger ?? (document.activeElement as HTMLElement | null);
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
  const first = dialog.querySelector<HTMLElement>(
    'input:not([type=hidden]), select, textarea, button:not([data-close-modal]):not([data-close-drawer]), a[href]',
  );
  (first ?? dialog.querySelector<HTMLElement>('button'))?.focus();
  dialog.dispatchEvent(new CustomEvent('dialog:open'));
}

function closeDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) return;
  dialog.close();
}

export function initOverlays() {
  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-open-modal],[data-open-drawer]',
    );
    if (t) {
      const id = t.dataset.openModal ?? t.dataset.openDrawer;
      const d = id ? (document.getElementById(id) as HTMLDialogElement | null) : null;
      if (d) {
        e.preventDefault();
        openDialog(d, t);
      }
      return;
    }
    const c = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-close-modal],[data-close-drawer]',
    );
    if (c) {
      const d = c.closest('dialog') as HTMLDialogElement | null;
      if (d) closeDialog(d);
    }
  });
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      // Backdrop click: the dialog element itself is the target (not its children).
      if (e.target === d) closeDialog(d);
    });
    d.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      lastTrigger?.focus();
      lastTrigger = null;
      d.dispatchEvent(new CustomEvent('dialog:close'));
    });
  });
}

export { openDialog, closeDialog };
