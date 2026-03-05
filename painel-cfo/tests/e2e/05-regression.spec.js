// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab } = require('./helpers');

/**
 * E2E Test Suite — Regression Tests
 * 
 * Tests for specific bugs that were found and fixed.
 * Each test documents the original bug and verifies the fix.
 */
test.describe('🐛 Regression Tests', () => {
  const jsErrors = [];

  test.beforeEach(async ({ page }) => {
    jsErrors.length = 0;
    page.on('pageerror', err => jsErrors.push(err.message));
    await login(page);
  });

  test('REG-001: prevSumMRR should not throw ReferenceError', async ({ page }) => {
    /**
     * BUG: In render(), prevSumMRR was used in trendHTML() but never defined.
     * FIX: Added prevSumMRR computation from previous period confirmed entradas.
     * SEVERITY: P0 — caused dashboard crash on Overview tab.
     */
    await navigateToTab(page, 'overview');

    // Navigate between months to trigger comparison calculations
    await page.selectOption('#fMonth', '5'); // June
    await page.waitForTimeout(300);
    await page.selectOption('#fMonth', '0'); // January
    await page.waitForTimeout(300);
    await page.selectOption('#fMonth', 'anual'); // Annual
    await page.waitForTimeout(300);

    // No JS errors should occur
    expect(jsErrors).toHaveLength(0);

    // MRR trend badge should render
    const mrrTrend = page.locator('#t-mrr-ov');
    await expect(mrrTrend).toContainText(/(NOVO|%|—|de Base Fixa)/);
  });

  test('REG-002: Tab switching should not cause JS errors', async ({ page }) => {
    /**
     * BUG: Rapid tab switching could cause render() to run on wrong view.
     * FIX: render() has early return for projecoes/relatorios tabs.
     */
    const tabs = ['overview', 'dre', 'annual', 'fixos', 'unicos', 'entradas', 'projecoes', 'relatorios'];
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`);
      await page.waitForTimeout(200);
    }
    // Rapid full cycle
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`);
    }
    
    expect(jsErrors).toHaveLength(0);
  });

  test('REG-003: DRE modal should open and close without errors', async ({ page }) => {
    /**
     * Validates the DRE drill-down modal opens for various categories
     * and closes cleanly without memory leaks or errors.
     */
    await navigateToTab(page, 'dre');

    // Try clicking on clickable DRE rows (if they have data)
    const clickableRows = page.locator('.dre-row-main.clickable, .dre-row-sub.clickable');
    const count = await clickableRows.count();
    
    if (count > 0) {
      await clickableRows.first().click();
      await expect(page.locator('#dre-modal')).toHaveClass(/open/, { timeout: 3_000 });
      
      // Close via Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('#dre-modal')).not.toHaveClass(/open/);
    }

    expect(jsErrors).toHaveLength(0);
  });

  test('REG-004: Filter by client/project should not break rendering', async ({ page }) => {
    /**
     * Validates that filtering by client/project doesn't cause null reference
     * errors when data arrays have entries without cliente/projeto fields.
     */
    await navigateToTab(page, 'overview');
    
    // Change filters (even if only default options exist)
    const clientSelect = page.locator('#fClient');
    const options = await clientSelect.locator('option').allTextContents();
    
    for (const opt of options.slice(0, 3)) {  // Test first 3 options
      await clientSelect.selectOption({ label: opt });
      await page.waitForTimeout(200);
    }

    expect(jsErrors).toHaveLength(0);
  });

  test('REG-005: Quarterly breakdown should handle empty projections', async ({ page }) => {
    /**
     * BUG: renderQuarterlyBreakdown() could fail if projecoes was empty object.
     * FIX: Defensive defaults in groupProjByMonth and rendering.
     */
    await navigateToTab(page, 'projecoes');
    
    // Change horizon to all values
    for (const h of ['3', '6', '12']) {
      await page.selectOption('#p-horizonte', h);
      await page.waitForTimeout(300);
    }

    // The breakdown container should exist and not cause errors
    await expect(page.locator('#p-quarterly-breakdown')).toBeVisible();
    expect(jsErrors).toHaveLength(0);
  });

  test('REG-006: Export modal should open and render options', async ({ page }) => {
    /**
     * Validates the export modal opens correctly with format and period options.
     */
    await navigateToTab(page, 'relatorios');
    
    await page.locator('button', { hasText: 'Configurar e Baixar Relatório' }).click();
    await expect(page.locator('#export-modal')).toHaveClass(/open/, { timeout: 3_000 });

    // Close
    await page.keyboard.press('Escape');
    await expect(page.locator('#export-modal')).not.toHaveClass(/open/);
    
    expect(jsErrors).toHaveLength(0);
  });

  test('REG-007: Money mask should handle edge cases', async ({ page }) => {
    /**
     * Tests the maskMoney function with various inputs.
     */
    await navigateToTab(page, 'fixos');
    await page.click('#btn-add-main');
    await page.waitForSelector('#drawer.open');

    const valorInput = page.locator('#f-valor');

    // Type a normal value
    await valorInput.fill('');
    await valorInput.type('150000');
    const val = await valorInput.inputValue();
    expect(val).toContain('1.500,00');

    // Clear and type zero
    await valorInput.fill('');
    await valorInput.type('0');
    
    expect(jsErrors).toHaveLength(0);
  });

  test('REG-008: Concurrent navigation to projecoes should render breakdown', async ({ page }) => {
    /**
     * Tests that going to projecoes tab and immediately changing horizon
     * doesn't cause a race condition.
     */
    await page.click('[data-tab="projecoes"]');
    // Immediately change horizon before render completes
    await page.selectOption('#p-horizonte', '12');
    await page.waitForTimeout(1000);

    await expect(page.locator('#p-quarterly-breakdown')).toBeVisible();
    expect(jsErrors).toHaveLength(0);
  });
});
