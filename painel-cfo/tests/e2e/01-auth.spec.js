// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab, waitForSync } = require('./helpers');

/**
 * E2E Test Suite — Authentication & Login
 * 
 * Tests the hardcoded credential login flow, invalid credentials,
 * keyboard navigation, and session visibility.
 */
test.describe('🔐 Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?debug=1');
    await page.waitForSelector('#login-screen', { state: 'visible' });
  });

  test('should show login screen on initial load', async ({ page }) => {
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#app')).not.toHaveClass(/visible/);
  });

  test('should login with valid credentials (daniel/admin2024)', async ({ page }) => {
    await page.fill('#lu', 'daniel');
    await page.fill('#lp', 'admin2024');
    await page.click('#btn-login');

    await expect(page.locator('#app')).toHaveClass(/visible/, { timeout: 5_000 });
    await expect(page.locator('#login-screen')).toBeHidden();
  });

  test('should login with all valid users', async ({ page }) => {
    const users = ['bgtech', 'gustavo', 'gui', 'lucas', 'daniel'];
    for (const u of users) {
      await page.goto('/?debug=1');
      await page.waitForSelector('#login-screen', { state: 'visible' });
      await page.fill('#lu', u);
      await page.fill('#lp', 'admin2024');
      await page.click('#btn-login');
      await expect(page.locator('#app')).toHaveClass(/visible/, { timeout: 5_000 });
    }
  });

  test('should reject invalid password', async ({ page }) => {
    await page.fill('#lu', 'daniel');
    await page.fill('#lp', 'wrongpass');
    await page.click('#btn-login');

    // App should NOT become visible
    await expect(page.locator('#login-screen')).toBeVisible();
    // Toast error should appear
    await expect(page.locator('.toast.err')).toBeVisible({ timeout: 3_000 });
  });

  test('should reject invalid username', async ({ page }) => {
    await page.fill('#lu', 'hacker');
    await page.fill('#lp', 'admin2024');
    await page.click('#btn-login');

    await expect(page.locator('#login-screen')).toBeVisible();
  });

  test('should login via Enter key on password field', async ({ page }) => {
    await page.fill('#lu', 'daniel');
    await page.fill('#lp', 'admin2024');
    await page.press('#lp', 'Enter');

    await expect(page.locator('#app')).toHaveClass(/visible/, { timeout: 5_000 });
  });

  test('should show welcome message for Gustavo', async ({ page }) => {
    await page.fill('#lu', 'gustavo');
    await page.fill('#lp', 'admin2024');
    await page.click('#btn-login');

    await expect(page.locator('#app')).toHaveClass(/visible/, { timeout: 5_000 });
    await expect(page.locator('#msg-gustavo')).toBeVisible();
  });

  test('should NOT show welcome message for non-Gustavo users', async ({ page }) => {
    await page.fill('#lu', 'daniel');
    await page.fill('#lp', 'admin2024');
    await page.click('#btn-login');

    await expect(page.locator('#app')).toHaveClass(/visible/, { timeout: 5_000 });
    await expect(page.locator('#msg-gustavo')).toBeHidden();
  });
});
