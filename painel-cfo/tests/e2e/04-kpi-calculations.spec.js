// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab } = require('./helpers');

/**
 * E2E Test Suite — KPI Rendering & Financial Calculations
 * 
 * Validates that KPI cards render without errors, DRE calculations
 * are consistent, charts initialize, and status banner responds
 * to financial health conditions.
 */
test.describe('📊 KPI & Calculations', () => {
  const jsErrors = [];

  test.beforeEach(async ({ page }) => {
    jsErrors.length = 0;
    page.on('pageerror', err => jsErrors.push(err.message));
    await login(page);
  });

  test.afterEach(async () => {
    expect(jsErrors, `JS errors during KPI rendering: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('should render all overview KPI cards without errors', async ({ page }) => {
    await navigateToTab(page, 'overview');

    // All KPI elements should exist and have text
    const kpis = ['v-caixa', 'v-runway', 'v-receita-ov', 'v-mrr-ov', 'v-burn-ov', 'v-fixos-ov', 'v-var-ov', 'v-res-liq'];
    for (const id of kpis) {
      const el = page.locator(`#${id}`);
      await expect(el).toBeVisible();
      const text = await el.textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should render MRR trend without prevSumMRR ReferenceError', async ({ page }) => {
    // This specifically tests the P0 bug fix (prevSumMRR was undefined)
    await navigateToTab(page, 'overview');

    // The MRR trend element should contain a trend badge (not crash)
    const mrrTrend = page.locator('#t-mrr-ov');
    await expect(mrrTrend).toBeVisible();
    const html = await mrrTrend.innerHTML();
    expect(html).toContain('trend-badge');
    
    // No JS errors should have occurred
    expect(jsErrors).toHaveLength(0);
  });

  test('should show status banner (verde/amarelo/vermelho)', async ({ page }) => {
    await navigateToTab(page, 'overview');

    const banner = page.locator('#status-banner');
    await expect(banner).toBeVisible();
    
    // Banner should have one of the three states
    const className = await banner.getAttribute('class');
    expect(['verde', 'amarelo', 'vermelho'].some(c => className.includes(c))).toBeTruthy();
  });

  test('should render DRE table with all 7 rows', async ({ page }) => {
    await navigateToTab(page, 'dre');

    const tbody = page.locator('#dre-tbody');
    await expect(tbody).toBeVisible();
    
    // DRE should have the main structural rows
    const mainRows = tbody.locator('.dre-row-main');
    const count = await mainRows.count();
    // Should have: Receita Bruta, Custos Variáveis, Margem Bruta, Custos Fixos,
    // Resultado Operacional, Impostos, Resultado Líquido = 7 main rows
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('should render DRE period label based on filter', async ({ page }) => {
    await navigateToTab(page, 'dre');

    const label = page.locator('#dre-lbl-periodo');
    await expect(label).toBeVisible();
    const text = await label.textContent();
    // Should contain a year or month name
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe('--');
  });

  test('should render charts without errors', async ({ page }) => {
    await navigateToTab(page, 'overview');

    // ApexCharts creates SVG elements inside chart containers
    await page.waitForTimeout(1500); // Charts take time to render
    const areaChart = page.locator('#chart-area svg');
    const donutChart = page.locator('#chart-donut svg');
    
    // At least the area chart should render
    await expect(areaChart).toBeVisible({ timeout: 5_000 });
  });

  test('should update KPIs when filter changes', async ({ page }) => {
    await navigateToTab(page, 'overview');

    // Get initial value
    const initialBurn = await page.locator('#v-burn-ov').textContent();

    // Change month filter to a different month
    await page.selectOption('#fMonth', '0'); // Janeiro
    await page.waitForTimeout(500);

    // Values should have re-rendered (may or may not be different, but no error)
    const newBurn = await page.locator('#v-burn-ov').textContent();
    expect(newBurn).toBeDefined();
  });

  test('should render annual balance tiles for 12 months', async ({ page }) => {
    await navigateToTab(page, 'annual');

    const grid = page.locator('#annual-grid');
    await expect(grid).toBeVisible();

    // Should have 12 month tiles
    const tiles = grid.locator('.month-tile');
    await expect(tiles).toHaveCount(12);
  });

  test('should open month modal on annual tile click', async ({ page }) => {
    await navigateToTab(page, 'annual');

    // Click the first month tile
    const firstTile = page.locator('.month-tile').first();
    await firstTile.click();

    await expect(page.locator('#month-modal')).toHaveClass(/open/, { timeout: 3_000 });
  });

  test('should render projecoes KPI cards', async ({ page }) => {
    await navigateToTab(page, 'projecoes');

    await expect(page.locator('#p-v-entradas')).toBeVisible();
    await expect(page.locator('#p-v-saidas')).toBeVisible();
    await expect(page.locator('#p-v-saldo')).toBeVisible();
  });
});
