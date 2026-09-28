/** ft/cm toggle persisted in localStorage (6.2, 7.4). Elements: [data-unit-toggle], [data-ft], [data-cm]. */
import { track } from './analytics';
const KEY = 'unit_pref';
export type Unit = 'ft' | 'cm';
export function getUnit(): Unit {
  try {
    return (localStorage.getItem(KEY) as Unit) || 'ft';
  } catch {
    return 'ft';
  }
}
export function applyUnit(unit: Unit, root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-ft]').forEach((el) => (el.hidden = unit !== 'ft'));
  root.querySelectorAll<HTMLElement>('[data-cm]').forEach((el) => (el.hidden = unit !== 'cm'));
  root
    .querySelectorAll<HTMLButtonElement>('[data-unit-toggle] button')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === unit)));
}
export function initUnitToggle() {
  applyUnit(getUnit());
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-unit-toggle] button');
    if (!b) return;
    const unit = b.dataset.unit as Unit;
    try {
      localStorage.setItem(KEY, unit);
    } catch {
      /* noop */
    }
    applyUnit(unit);
    track('unit_toggle', { unit });
  });
}
