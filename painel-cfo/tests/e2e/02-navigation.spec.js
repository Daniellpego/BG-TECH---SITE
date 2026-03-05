// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab } = require('./helpers');

/**
 * E2E Test Suite — Tab Navigation & View Rendering
 * 
 * Validates that all sidebar tabs render correctly,
 * views toggle properly, page title updates, and
 * no JavaScript errors occur during navigation.
 */
test.describe('🗂️ Navigation', () => {
  /** Collect JS errors during the test */
  const jsErrors = [];

  test.beforeEach(async ({ page }) => {
    jsErrors.length = 0;
    page.on('pageerror', err => jsErrors.push(err.message));
    await login(page);
  });

  test.afterEach(async () => {
    // Fail if any JavaScript error occurred
    expect(jsErrors, `Unexpected JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  const tabs = [
    { tab: 'overview', title: 'Painel Geral', view: 'view-overview' },
    { tab: 'dre', title: 'DRE Gerencial', view: 'view-dre' },
    { tab: 'annual', title: 'Balanço Anual', view: 'view-annual' },
    { tab: 'entradas', title: 'Receitas', view: 'view-entradas' },
    { tab: 'fixos', title: 'Custos Fixos', view: 'view-list' },
    { tab: 'unicos', title: 'Gastos Variáveis', view: 'view-list' },
    { tab: 'relatorios', title: 'Exportar', view: 'view-relatorios' },
    { tab: 'projecoes', title: 'Projeções', view: 'view-projecoes' },
  ];

  for (const { tab, title, view } of tabs) {
    test(`should navigate to "${tab}" tab and show correct view`, async ({ page }) => {
      await page.click(`[data-tab="${tab}"]`);
      
      // View should be active
      await expect(page.locator(`#${view}`)).toHaveClass(/active/, { timeout: 3_000 });
      
      // Page title should update
      await expect(page.locator('#page-title')).toHaveText(title);
      
      // Sidebar button should be marked active
      await expect(page.locator(`[data-tab="${tab}"]`)).toHaveClass(/active/);
    });
  }

  test('should hide filters and add button on projecoes tab', async ({ page }) => {
    await navigateToTab(page, 'projecoes');
    await expect(page.locator('#main-filters')).toBeHidden();
    await expect(page.locator('#btn-add-main')).toBeHidden();
  });

  test('should hide filters and add button on relatorios tab', async ({ page }) => {
    await navigateToTab(page, 'relatorios');
    await expect(page.locator('#main-filters')).toBeHidden();
    await expect(page.locator('#btn-add-main')).toBeHidden();
  });

  test('should show filters and add button on data tabs', async ({ page }) => {
    for (const tab of ['overview', 'fixos', 'entradas']) {
      await navigateToTab(page, tab);
      await expect(page.locator('#main-filters')).toBeVisible();
      await expect(page.locator('#btn-add-main')).toBeVisible();
    }
  });

  test('should close drawers/modals on Escape key', async ({ page }) => {
    // Open the new entry drawer
    await page.click('#btn-add-main');
    await expect(page.locator('#drawer')).toHaveClass(/open/);
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer')).not.toHaveClass(/open/);
  });
});
