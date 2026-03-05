// @ts-check
const { test, expect } = require('@playwright/test');
const {
  login, navigateToTab, waitForSync, getKPIValue,
  openNewEntryDrawer, fillAndSaveEntry, uniqueName,
  fetchRowDirect, cleanupTestItems,
} = require('./helpers');

/**
 * 08-dashboard-sync.spec.js — P0 BUGFIX Tests
 *
 * Validates the fix for:
 *   "As abas de CRUD (Custos Fixos / Projeções etc.) mostram dados inseridos,
 *    mas ao voltar para 'Painel Geral' os KPIs ficam zerados."
 *
 * Covers hypotheses H1–H6 from the bug report.
 * Acceptance criteria:
 *   ✓ KPIs reflect within 500ms of tab switch
 *   ✓ No NaN / Infinity
 *   ✓ No console errors
 *   ✓ Works after reload
 */

test.describe('P0 — Painel Geral KPI Sync', () => {

  test.beforeAll(async () => {
    await cleanupTestItems('SYNC_TEST_');
  });

  test.afterAll(async () => {
    await cleanupTestItems('SYNC_TEST_');
  });

  // ────────────────────────────────────────────────────
  // T1: Filters sync with system date on load
  // Validates H5: getFilters returns correct values
  // ────────────────────────────────────────────────────
  test('T1: fYear defaults to system year on init', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    await login(page);
    await waitForSync(page);

    const curYear = new Date().getFullYear();
    const fYearVal = await page.locator('#fYear').inputValue();
    expect(fYearVal).toBe(String(curYear));

    const fMonthVal = await page.locator('#fMonth').inputValue();
    expect(fMonthVal).toBe(String(new Date().getMonth()));

    // No JS errors
    const cfoErrors = consoleErrors.filter(e => !e.includes('[CFO]'));
    expect(cfoErrors).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────
  // T2: KPIs update when switching back to Painel Geral
  // Validates H1/H2: render() uses current state, tab() calls render()
  // ────────────────────────────────────────────────────
  test('T2: KPIs reflect data after navigating fixos → overview', async ({ page }) => {
    await login(page);
    await waitForSync(page);

    // Record initial KPI values on overview
    const initialBurn = await getKPIValue(page, 'v-burn-ov');

    // Navigate to fixos, then back to overview
    await navigateToTab(page, 'fixos');
    await page.waitForTimeout(300);
    await navigateToTab(page, 'overview');

    // KPIs should match initial values (no zeroing)
    const afterBurn = await getKPIValue(page, 'v-burn-ov');
    expect(afterBurn).toBe(initialBurn);
  });

  // ────────────────────────────────────────────────────
  // T3: New item reflects in KPIs within 500ms
  // Validates H1: render() uses fresh state after save()
  // ────────────────────────────────────────────────────
  test('T3: Add fixo → switch to overview → KPIs include new value', async ({ page }) => {
    const itemName = uniqueName('SYNC_TEST_FX');
    const itemValor = '1.500,00'; // R$ 1,500

    await login(page);
    await waitForSync(page);

    // Get initial burn on overview
    const initialBurn = await getKPIValue(page, 'v-burn-ov');

    // Navigate to fixos and add a new item
    await navigateToTab(page, 'fixos');
    await openNewEntryDrawer(page);
    await fillAndSaveEntry(page, {
      nome: itemName,
      valor: itemValor,
      status: 'Confirmado',
    });

    // Wait for save + push
    await page.waitForTimeout(500);

    // Switch to overview — KPIs should include the new R$ 1,500
    await navigateToTab(page, 'overview');

    const newBurn = await getKPIValue(page, 'v-burn-ov');
    // Parse values: "R$ 1.850,10" → 1850.10
    const parseBRL = (s) => parseFloat(
      (s || '').replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.') || '0'
    );
    const diff = parseBRL(newBurn) - parseBRL(initialBurn);
    // The new item should add ~R$ 1,500 to the burn rate
    expect(diff).toBeGreaterThanOrEqual(1400);
    expect(diff).toBeLessThanOrEqual(1600);
  });

  // ────────────────────────────────────────────────────
  // T4: No NaN or Infinity in KPI values
  // Validates defensive _safe() guard in render()
  // ────────────────────────────────────────────────────
  test('T4: KPI values never show NaN or Infinity', async ({ page }) => {
    await login(page);
    await waitForSync(page);

    const kpiIds = [
      'v-caixa', 'v-runway', 'v-receita-ov', 'v-res-liq',
      'v-mrr-ov', 'v-burn-ov', 'v-fixos-ov', 'v-var-ov',
    ];

    for (const id of kpiIds) {
      const text = await page.locator(`#${id}`).textContent();
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('Infinity');
      expect(text).not.toContain('undefined');
    }
  });

  // ────────────────────────────────────────────────────
  // T5: KPIs survive page reload
  // Validates H6: fetchSync restores state correctly
  // ────────────────────────────────────────────────────
  test('T5: KPIs match before and after full page reload', async ({ page }) => {
    await login(page);
    await waitForSync(page);
    await page.waitForTimeout(1000); // Let fetchSync settle

    // Capture KPIs
    const burnBefore = await getKPIValue(page, 'v-burn-ov');
    const fixosBefore = await getKPIValue(page, 'v-fixos-ov');

    // Full reload
    await page.reload();
    await login(page);
    await waitForSync(page);
    await page.waitForTimeout(1000);

    const burnAfter = await getKPIValue(page, 'v-burn-ov');
    const fixosAfter = await getKPIValue(page, 'v-fixos-ov');

    expect(burnAfter).toBe(burnBefore);
    expect(fixosAfter).toBe(fixosBefore);
  });

  // ────────────────────────────────────────────────────
  // T6: Rapid tab switching doesn't zero out KPIs
  // Validates race condition fix (pushSync _syncInFlight guard)
  // ────────────────────────────────────────────────────
  test('T6: Rapid tab switching keeps KPIs stable', async ({ page }) => {
    await login(page);
    await waitForSync(page);

    // Record baseline KPIs
    const baseBurn = await getKPIValue(page, 'v-burn-ov');

    // Rapidly switch tabs 5 times
    for (let i = 0; i < 5; i++) {
      await navigateToTab(page, 'fixos');
      await navigateToTab(page, 'entradas');
      await navigateToTab(page, 'dre');
      await navigateToTab(page, 'overview');
    }

    // Wait for any async operations to settle
    await page.waitForTimeout(500);

    const finalBurn = await getKPIValue(page, 'v-burn-ov');
    expect(finalBurn).toBe(baseBurn);

    // Ensure no NaN crept in
    const text = await page.locator('#v-burn-ov').textContent();
    expect(text).not.toContain('NaN');
  });

});
