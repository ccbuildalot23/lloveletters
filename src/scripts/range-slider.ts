export function initRangeSliders(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-range]').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    const min = Number(el.dataset.min);
    const max = Number(el.dataset.max);
    const tMin = el.querySelector<HTMLInputElement>('[data-thumb=min]')!;
    const tMax = el.querySelector<HTMLInputElement>('[data-thumb=max]')!;
    const iMin = el.querySelector<HTMLInputElement>('[data-input=min]')!;
    const iMax = el.querySelector<HTMLInputElement>('[data-input=max]')!;
    const fill = el.querySelector<HTMLElement>('[data-track-fill]')!;
    const sync = (from: 'thumb' | 'input', emit = true) => {
      let a = Number(from === 'thumb' ? tMin.value : iMin.value);
      let b = Number(from === 'thumb' ? tMax.value : iMax.value);
      if (Number.isNaN(a)) a = min;
      if (Number.isNaN(b)) b = max;
      a = Math.max(min, Math.min(a, max));
      b = Math.max(min, Math.min(b, max));
      if (a > b) [a, b] = from === 'thumb' ? [b, b] : [a, a];
      tMin.value = String(a);
      tMax.value = String(b);
      iMin.value = String(a);
      iMax.value = String(b);
      fill.style.left = `${((a - min) / (max - min)) * 100}%`;
      fill.style.right = `${100 - ((b - min) / (max - min)) * 100}%`;
      // keep the active thumb on top
      tMin.style.zIndex = a >= max - (max - min) * 0.05 ? '3' : '2';
      if (emit)
        el.dispatchEvent(
          new CustomEvent('range:change', { detail: { min: a, max: b }, bubbles: true }),
        );
    };
    tMin.addEventListener('input', () => sync('thumb'));
    tMax.addEventListener('input', () => sync('thumb'));
    iMin.addEventListener('change', () => sync('input'));
    iMax.addEventListener('change', () => sync('input'));
    (el as HTMLElement & { setRange?: (a: number, b: number) => void }).setRange = (a, b) => {
      iMin.value = String(a);
      iMax.value = String(b);
      sync('input', false);
    };
    sync('input', false);
  });
}
