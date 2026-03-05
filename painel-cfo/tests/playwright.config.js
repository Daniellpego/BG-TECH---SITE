// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Painel CFO Dashboard
 * 
 * Uses dev-server.js which serves static files AND proxies
 * /api/painel to the Vercel serverless function handler.
 * 
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 
 * Run: npx playwright test --config=playwright.config.js
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,          // Tests share state via Supabase, run serial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                    // Single worker — dashboard uses shared DB row
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'node dev-server.js',
    port: 5500,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://urpuiznydrlwmaqhdids.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
  },
});
