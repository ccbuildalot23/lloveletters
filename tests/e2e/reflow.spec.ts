import { test, expect } from '@playwright/test';

/** 13.11: reflow at 320px and no horizontal scroll at each tested width (3.4). */
for (const width of [320, 360, 390, 412, 768, 1024, 1440, 1920]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/rugs', '/rugs/sample-vintage-oushak-faded-coral-sage']) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} @ ${width}`).toBeLessThanOrEqual(1);
    }
  });
}

test('text spacing overrides do not break the product page', async ({ page }) => {
  await page.goto('/rugs/sample-vintage-oushak-faded-coral-sage');
  await page.addStyleTag({
    content:
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
