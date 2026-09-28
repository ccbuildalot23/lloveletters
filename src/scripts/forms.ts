/**
 * Progressive enhancement for every <form data-form>:
 * - inline validation on blur, error summary on submit (11.2)
 * - loading state, double-submit prevention
 * - fetch POST as JSON (or multipart for uploads), success/error UI
 * - keeps user input on network failure (16.6)
 * - lazy-loads Turnstile on first focus
 * - attaches UTM/source (15.4) and fires analytics (15.3)
 */
import { track } from './analytics';
import { getUtmContext } from './utm';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      getResponse: (id?: string) => string;
    };
  }
}

let turnstileLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoading) return turnstileLoading;
  turnstileLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
  return turnstileLoading;
}

async function mountTurnstile(form: HTMLFormElement) {
  const el = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!el || el.dataset.widget) return;
  await loadTurnstile();
  if (!window.turnstile || el.dataset.widget) return;
  const id = window.turnstile.render(el, {
    sitekey: el.dataset.sitekey,
    action: el.dataset.action,
    size: 'flexible',
    appearance: 'interaction-only',
    'response-field-name': 'turnstile_token',
  });
  el.dataset.widget = id;
}

function fieldError(form: HTMLFormElement, name: string): HTMLElement | null {
  const f =
    form.querySelector<HTMLElement>(`[data-field="${name}"] .field-error`) ??
    form.querySelector<HTMLElement>(`[data-field-error="${name}"]`) ??
    form.querySelector<HTMLElement>(`#f-${name}-error`);
  return f;
}

function setError(form: HTMLFormElement, name: string, message: string | null) {
  const input = form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
  const el = fieldError(form, name);
  const target = input instanceof RadioNodeList ? (input[0] as HTMLInputElement) : input;
  if (el) {
    el.textContent = message ?? '';
    el.classList.toggle('hidden', !message);
  }
  if (target) target.setAttribute('aria-invalid', message ? 'true' : 'false');
}

const messages: Record<string, string> = {
  valueMissing: 'This field is required.',
  typeMismatch: 'Please check the format.',
  patternMismatch: 'Please check the format.',
  tooShort: 'A little more detail, please.',
  tooLong: 'That’s a bit long.',
  rangeUnderflow: 'Too low.',
  rangeOverflow: 'Too high.',
};

function validateField(
  form: HTMLFormElement,
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): boolean {
  if (!input.name || input.type === 'hidden') return true;
  if (input.validity.valid) {
    setError(form, input.name, null);
    return true;
  }
  const v = input.validity;
  let msg = messages.valueMissing!;
  for (const key of Object.keys(messages))
    if ((v as unknown as Record<string, boolean>)[key]) msg = messages[key]!;
  if (input.type === 'email' && v.typeMismatch) msg = 'Enter a valid email like you@example.com.';
  setError(form, input.name, msg);
  return false;
}

function showSummary(form: HTMLFormElement, errors: Array<{ name: string; message: string }>) {
  const summary = form.querySelector<HTMLElement>('.form-summary');
  if (!summary) return;
  if (!errors.length) {
    summary.classList.add('hidden');
    summary.innerHTML = '';
    return;
  }
  summary.innerHTML = `<p class="font-medium">Please fix ${errors.length} ${errors.length === 1 ? 'thing' : 'things'}:</p><ul class="mt-1 list-disc pl-5">${errors
    .map((e) => {
      const input = form.elements.namedItem(e.name) as HTMLElement | RadioNodeList | null;
      const id = input instanceof RadioNodeList ? (input[0] as HTMLElement)?.id : input?.id;
      return `<li><a href="#${id ?? ''}" class="underline">${e.message}</a></li>`;
    })
    .join('')}</ul>`;
  summary.classList.remove('hidden');
  summary.focus();
}

function setLoading(form: HTMLFormElement, loading: boolean) {
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]');
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span><span>${btn.dataset.loadingText ?? 'Sending…'}</span>`;
  } else {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}

export async function submitForm(form: HTMLFormElement) {
  const errors: Array<{ name: string; message: string }> = [];
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input, textarea, select'));
  const seen = new Set<string>();
  for (const input of inputs) {
    if (seen.has(input.name)) continue;
    seen.add(input.name);
    if (!validateField(form, input)) {
      const el = fieldError(form, input.name);
      errors.push({
        name: input.name,
        message: `${form.querySelector(`label[for="${input.id}"]`)?.textContent?.replace(/\*.*$/, '').trim() || input.name}: ${el?.textContent}`,
      });
    }
  }
  showSummary(form, errors);
  if (errors.length) return;

  const utm = form.querySelector<HTMLInputElement>('[data-utm]');
  if (utm) utm.value = JSON.stringify(getUtmContext());

  setLoading(form, true);
  const hasFile = !!form.querySelector('input[type=file]');
  const fd = new FormData(form);
  const body: BodyInit = hasFile ? fd : JSON.stringify(formDataToObject(fd));
  const headers: Record<string, string> = hasFile ? {} : { 'content-type': 'application/json' };
  headers['accept'] = 'application/json';
  try {
    const res = await fetch(form.action, { method: 'POST', body, headers });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      errors?: Record<string, string>;
      already?: boolean;
      redirect?: string;
    };
    if (res.ok && data.ok) {
      form
        .querySelectorAll<HTMLElement>(
          '.form-body, fieldset, .form-field, button[type=submit], [data-turnstile], .newsletter-form > div:not(.form-success):not(.form-summary)',
        )
        .forEach((el) => el.classList.add('hidden'));
      const success = form.querySelector<HTMLElement>('.form-success');
      if (success) {
        if (data.already) {
          const p = success.querySelector('p');
          if (p)
            p.textContent =
              data.message ?? 'You’re already on the list — thanks for the enthusiasm.';
        }
        success.classList.remove('hidden');
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
      track((form.dataset.track as 'generate_lead') ?? 'generate_lead', {
        form_type: form.dataset.formType ?? form.dataset.form ?? 'form',
      });
      form.dispatchEvent(new CustomEvent('form:success', { detail: data, bubbles: true }));
      if (data.redirect) window.location.assign(data.redirect);
    } else {
      if (data.errors) {
        const list: Array<{ name: string; message: string }> = [];
        for (const [name, message] of Object.entries(data.errors)) {
          setError(form, name, message);
          list.push({ name, message });
        }
        showSummary(form, list);
      } else {
        showSummary(form, [
          { name: '', message: data.message ?? 'Couldn’t send. Please try again.' },
        ]);
      }
      window.turnstile?.reset(form.querySelector<HTMLElement>('[data-turnstile]')?.dataset.widget);
    }
  } catch {
    // Network error: keep input, show message (16.6)
    showSummary(form, [
      { name: '', message: 'Couldn’t send — check your connection and try again.' },
    ]);
  } finally {
    setLoading(form, false);
  }
}

function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    if (k in out) {
      const cur = out[k];
      out[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
    } else out[k] = v;
  }
  // checkbox groups always arrays
  for (const k of ['interests', 'project_types', 'colors'])
    if (k in out && !Array.isArray(out[k])) out[k] = [out[k]];
  return out;
}

export function initForms(root: ParentNode = document) {
  root.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = '1';
    form.addEventListener('focusin', () => void mountTurnstile(form), { once: true });
    form.addEventListener('pointerenter', () => void mountTurnstile(form), { once: true });
    form.addEventListener(
      'blur',
      (e) => {
        const t = e.target as HTMLInputElement;
        if (t && 'validity' in t && t.name) validateField(form, t);
      },
      true,
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void submitForm(form);
    });
  });
}
