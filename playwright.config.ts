import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * E2E tests run against the built static site served by `astro preview`
 * (no Functions) by default. Set E2E_BASE_URL to a `wrangler pages dev` URL
 * to exercise the API routes (checkout race test, forms).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4321';
const useWrangler = !!process.env.E2E_BASE_URL;
// Use a preinstalled Chromium when present (e.g. PLAYWRIGHT_CHROMIUM_PATH in cloud sandboxes).
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    : undefined);
const launchOptions = executablePath ? { executablePath, args: ['--no-sandbox'] } : {};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions,
  },
  webServer: useWrangler
    ? undefined
    : {
        command: 'npx astro preview --host 127.0.0.1 --port 4321',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'a11y', testMatch: /a11y\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'iphone-se',
      use: { ...devices['iPhone SE'], browserName: 'chromium' },
      testIgnore: /a11y|api/,
    },
    {
      name: 'iphone-15',
      use: { ...devices['iPhone 15'], browserName: 'chromium' },
      testIgnore: /a11y|api/,
    },
    {
      name: 'pixel-8',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
      testIgnore: /a11y|api/,
    },
    {
      name: 'ipad',
      use: { ...devices['iPad (gen 7)'], browserName: 'chromium' },
      testIgnore: /a11y|api/,
    },
    { name: 'api', testMatch: /api\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
});
