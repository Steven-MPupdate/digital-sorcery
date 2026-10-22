/**
 * playwright.config.js: Browser test settings.
 *
 * Runs tests/e2e in real Chromium sized like a Galaxy Note 20 (412×915, touch),
 * plus a narrow 360px phone. Starts two local servers (scripts/serve.js) automatically:
 * one at the root and one under /digital-sorcery/ like GitHub Pages.
 * Run with: npm run test:e2e
 */

import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // DEV NOTE: no retries on purpose: a flaky test is a bug to fix, not hide.
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'note20',
      use: { browserName: 'chromium', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.6 },
    },
    {
      name: 'small-phone',
      use: { browserName: 'chromium', viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: 'node scripts/serve.js',
      env: { PORT: String(PORT) },
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Same site served under /digital-sorcery/, exactly like GitHub Pages (see the sub-path test).
      command: 'node scripts/serve.js',
      env: { PORT: String(PORT + 1), BASE_PATH: '/digital-sorcery/' },
      url: `http://localhost:${PORT + 1}/digital-sorcery/`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
