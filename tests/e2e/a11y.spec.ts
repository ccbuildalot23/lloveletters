import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** 13.12: axe on every public route (static preview; API routes are not part of the page). */
const routes = [
  '/',
  '/rugs',
  '/rugs/sample-vintage-oushak-faded-coral-sage',
  '/rugs/sample-antique-kayseri-prayer-rug',
  '/collections/oushak',
  '/sizes/8x10',
  '/about',
  '/authenticity',
  '/care',
  '/trade',
  '/book',
  '/waitlist',
  '/reviews',
  '/faq',
  '/shipping-duties',
  '/returns',
  '/privacy',
  '/terms',
  '/accessibility',
  '/contact',
  '/search?q=oushak',
  '/cart',
  '/checkout/cancel',
  '/404',
  '/styleguide',
];

for (const route of routes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle').catch(() => null);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .disableRules(['region'])
      .analyze();
    const violations = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical' || v.impact === 'moderate',
    );
    expect(
      violations,
      JSON.stringify(
        violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.slice(0, 3).map((n) => n.html),
        })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}
