import { defineConfig, devices } from '@playwright/test';

/**
 * CAPTCHA Shield v4.0 — Playwright Configuration
 *
 * E2E smoke tests for the 10 challenges and core widget.
 *
 * Usage:
 *   npx playwright install        # Install browsers (first time)
 *   npx playwright test           # Run all tests
 *   npx playwright test --ui      # Run with UI
 *   npx playwright test e2e/smoke # Run only smoke tests
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
