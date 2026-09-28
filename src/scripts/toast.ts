export type ToastKind = 'info' | 'success' | 'error';

export function toast(message: string, kind: ToastKind = 'info', timeout = 5000) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, kind, timeout } }));
}

export function initToasts() {
  const region = document.getElementById('toast-region');
  const tpl = document.getElementById('toast-template') as HTMLTemplateElement | null;
  if (!region || !tpl) return;
  window.addEventListener('toast', (e) => {
    const { message, kind = 'info', timeout = 5000 } = (e as CustomEvent).detail ?? {};
    const node = (tpl.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
    node.querySelector('.toast-message')!.textContent = message;
    if (kind === 'error') node.classList.replace('bg-charcoal', 'bg-error');
    if (kind === 'success') node.classList.replace('bg-charcoal', 'bg-olive');
    const remove = () => node.remove();
    node.querySelector('.toast-close')?.addEventListener('click', remove);
    region.appendChild(node);
    if (timeout > 0) setTimeout(remove, timeout);
  });
}
