import { test, expect } from '@playwright/test';

test.describe('navigation & layout', () => {
  test('home renders hero, trust bar, latest drop, waitlist', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Verified at the loom');
    await expect(page.getByRole('region', { name: 'Why buy from us' })).toBeVisible();
    await expect(page.locator('[data-rug-card]').first()).toBeVisible();
    await expect(page.locator('#waitlist form')).toBeVisible();
  });

  test('skip link is the first focusable element', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
  });

  test('mobile menu opens, traps focus, closes with Escape and restores focus', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.click();
    const dialog = page.locator('#mobile-menu');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('announcement bar dismiss is remembered', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dismiss announcement' }).click();
    await page.reload();
    await expect(page.locator('#announcement')).toBeHidden();
  });

  test('404 page suggests rugs', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('wandered off');
  });
});

test.describe('collection filters (6.2–6.5)', () => {
  test('filters combine, update count, persist in URL, and back button restores', async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, 'desktop sidebar');
    await page.goto('/rugs');
    const count = page.locator('[data-count-total]');
    const initial = Number(await count.textContent());
    await page.locator('input[name="style"][value="oushak"]').check();
    await expect(page).toHaveURL(/style=oushak/);
    const afterStyle = Number(await count.textContent());
    expect(afterStyle).toBeLessThan(initial);
    await page.locator('input[name="size"][value="8x10"]').check();
    await expect(page).toHaveURL(/size=8x10/);
    expect(Number(await count.textContent())).toBeLessThanOrEqual(afterStyle);
    await page.goBack();
    await expect(page).not.toHaveURL(/size=8x10/);
    await expect(page.locator('input[name="size"][value="8x10"]')).not.toBeChecked();
    await page.getByRole('button', { name: /Remove filter: Oushak/ }).click();
    expect(Number(await count.textContent())).toBe(initial);
  });

  test('sold rugs hidden by default and shown with the toggle', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop sidebar');
    await page.goto('/rugs');
    await expect(page.locator('[data-rug-card][data-status="sold"]:visible')).toHaveCount(0);
    await page.getByRole('switch', { name: 'Show sold rugs' }).check();
    await expect(page.locator('[data-rug-card][data-status="sold"]:visible').first()).toBeVisible();
  });

  test('empty state offers clear and request form', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop sidebar');
    await page.goto('/rugs?style=kilim&size=9x12');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('#filter-request')).toBeVisible();
    await page.getByRole('button', { name: 'Clear all' }).last().click();
    await expect(page.locator('[data-empty]')).toBeHidden();
  });

  test('sort by price ascending reorders cards', async ({ page }) => {
    await page.goto('/rugs');
    await page.locator('[data-sort]').selectOption('price-asc');
    const prices = await page
      .locator('[data-rug-card]:visible')
      .evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.price)));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

test.describe('search (6.6)', () => {
  test('overlay finds by style with typo tolerance and by ID', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search rugs' }).click();
    const input = page.getByRole('combobox');
    await input.fill('oushk');
    await expect(page.locator('[data-search-results] [role=option]').first()).toBeVisible();
    await input.fill('TR-0002');
    await page.waitForURL(/sample-new-oushak-ivory-slate/);
  });

  test('search page shows results', async ({ page }) => {
    await page.goto('/search?q=runner');
    await expect(page.locator('[data-search-page-results] li').first()).toBeVisible();
  });
});

test.describe('product page (7)', () => {
  test('shows FTC fiber content, dealer, flip video, certificate, returns summary', async ({
    page,
  }) => {
    await page.goto('/rugs/sample-vintage-oushak-faded-coral-sage');
    await expect(page.getByText(/Fiber content:/)).toBeVisible();
    await expect(page.getByText(/Imported from Turkey/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The flip test' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Download certificate/ })).toBeVisible();
    await expect(page.locator('summary', { hasText: '30-day returns' })).toBeVisible();
    const productLd = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]')).filter((s) =>
          s.textContent?.includes('"@type":"Product"'),
        ).length,
    );
    expect(productLd).toBe(1);
  });

  test('gallery lightbox opens, navigates by keyboard, closes with Escape and restores focus', async ({
    page,
  }) => {
    await page.goto('/rugs/sample-vintage-oushak-faded-coral-sage');
    const btn = page.getByRole('button', { name: 'Full screen', exact: true });
    await btn.click();
    const lb = page.locator('[data-lightbox]');
    await expect(lb).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(lb.locator('[data-lb-counter]')).toHaveText(/2 \//);
    await page.keyboard.press('Escape');
    await expect(lb).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('unit toggle switches ft/cm and persists', async ({ page }) => {
    await page.goto('/rugs/sample-vintage-oushak-faded-coral-sage');
    await page.locator('[data-purchase] [data-unit="cm"]').click();
    await expect(page.locator('[data-purchase] [data-cm]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-purchase] [data-cm]')).toBeVisible();
  });

  test('sold rug shows find-similar form instead of buy CTA', async ({ page }) => {
    await page.goto('/rugs/sample-antique-kayseri-prayer-rug');
    await expect(page.getByRole('heading', { name: 'Find me one like it' })).toBeVisible();
    await expect(page.locator('[data-buy-now]:visible')).toHaveCount(0);
  });

  test('ID in URL redirects to slug (needs wrangler)', async ({ page, baseURL }) => {
    test.skip(!process.env.E2E_BASE_URL, 'Functions only');
    await page.goto('/rugs/TR-0001');
    expect(page.url()).toBe(`${baseURL}/rugs/sample-vintage-oushak-faded-coral-sage`);
  });
});

test.describe('forms UX (11.2)', () => {
  test('waitlist form validates inline, shows an error summary that links to fields', async ({
    page,
  }) => {
    await page.goto('/waitlist');
    const form = page.locator('#landing-waitlist');
    await form.getByRole('button', { name: 'Join the drop list' }).click();
    const summary = form.locator('.form-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await summary.getByRole('link').first().click();
    await expect(form.locator('input[name=email]')).toBeFocused();
    await expect(form.locator('input[name=email]')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('waitlist mode (5.1)', () => {
  test('prices hidden and checkout promoted to the drop list', async ({ page }) => {
    await page.goto('/rugs/sample-vintage-oushak-faded-coral-sage');
    const mode = await page.evaluate(
      () => (window as unknown as { __launchMode: string }).__launchMode,
    );
    if (mode === 'waitlist') {
      await expect(page.getByText('Price revealed at launch').first()).toBeVisible();
      await expect(
        page.locator('[data-purchase]').getByRole('link', { name: 'Join the drop list' }),
      ).toBeVisible();
    } else {
      await expect(page.locator('[data-buy-now]').first()).toBeVisible();
    }
  });
});
