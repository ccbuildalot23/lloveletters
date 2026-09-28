import { test, expect } from '@playwright/test';

/** 13.2 / 21: keyboard-only walkthrough of browse → product → (waitlist or checkout CTA). */
test('keyboard-only path from home to product CTA', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop keyboard walkthrough');
  await page.goto('/');
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  // Tab to the first rug card link
  let tries = 0;
  while (tries++ < 40) {
    await page.keyboard.press('Tab');
    const href = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement)?.getAttribute('href') ?? '',
    );
    if (href.startsWith('/rugs/')) break;
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/rugs\//);
  // Focus is visible: outline present on the focused element
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(
    () => getComputedStyle(document.activeElement as Element).outlineStyle,
  );
  expect(outline).not.toBe('none');
  // Reach the primary CTA (Buy now or Join the drop list) by keyboard
  tries = 0;
  let found = false;
  while (tries++ < 80) {
    await page.keyboard.press('Tab');
    const txt = await page.evaluate(
      () => (document.activeElement as HTMLElement)?.textContent?.trim() ?? '',
    );
    if (/^(Buy now|Join the drop list)$/.test(txt)) {
      found = true;
      break;
    }
  }
  expect(found).toBe(true);
  // Focus never hidden behind the sticky header
  const box = await page.evaluate(() => {
    const r = (document.activeElement as HTMLElement).getBoundingClientRect();
    const h = document.querySelector('[data-header]')!.getBoundingClientRect();
    return { top: r.top, headerBottom: h.bottom };
  });
  expect(box.top).toBeGreaterThanOrEqual(box.headerBottom - 1);
});
