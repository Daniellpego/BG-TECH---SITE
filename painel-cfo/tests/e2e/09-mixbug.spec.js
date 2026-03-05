// @ts-check
const { test, expect } = require('@playwright/test');
const {
  login,
  waitForSync,
  navigateToTab,
  openNewEntryDrawer,
  fillAndSaveEntry,
  uniqueName,
  findItemInDB,
  getKPIValue,
  cleanupTestItems,
} = require('./helpers');

test.describe('E2E 09 - Mix Bug hardening', () => {
  test.beforeEach(async () => {
    await cleanupTestItems('MIX09_').catch(() => {});
  });

  test('T1: No flicker after polling + tab switches', async ({ page }) => {
    const r1 = uniqueName('MIX09_R1');
    const r2 = uniqueName('MIX09_R2');
    const fx = uniqueName('MIX09_FX');
    const pj = uniqueName('MIX09_PJ');

    await login(page);
    await waitForSync(page);

    await navigateToTab(page, 'entradas');
    await openNewEntryDrawer(page, 'entrada');
    await fillAndSaveEntry(page, { nome: r1, valor: '2.000,00', status: 'Confirmado' });

    await openNewEntryDrawer(page, 'entrada');
    await fillAndSaveEntry(page, { nome: r2, valor: '1.500,00', status: 'Confirmado' });

    await navigateToTab(page, 'fixos');
    await openNewEntryDrawer(page);
    await fillAndSaveEntry(page, {
      nome: fx,
      valor: '300,00',
      status: 'Confirmado',
      recorrente: 'mensal',
    });

    await navigateToTab(page, 'projecoes');
    await page.click('button:has-text("Projetar Receita")');
    await page.fill('#pf-nome', pj);
    await page.fill('#pf-valor', '1.250,00');
    await page.click('#btn-proj-save');

    await page.waitForTimeout(61_000); // pega dois polls de 20s

    await navigateToTab(page, 'fixos');
    const countAfter = await page.locator('#table-body tr').count();
    expect(countAfter).toBeGreaterThanOrEqual(12);

    await navigateToTab(page, 'overview');
    const burn = await getKPIValue(page, 'v-burn-ov');
    const receita = await getKPIValue(page, 'v-receita-ov');
    expect(burn).not.toContain('R$ 0,00');
    expect(receita).not.toContain('R$ 0,00');
  });

  test('T2: Conflict stable between two sessions', async ({ browser }) => {
    const a = uniqueName('MIX09_A');
    const b = uniqueName('MIX09_B');

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await login(p1);
    await login(p2);
    await waitForSync(p1);
    await waitForSync(p2);

    await navigateToTab(p1, 'entradas');
    await openNewEntryDrawer(p1, 'entrada');
    await fillAndSaveEntry(p1, { nome: a, valor: '900,00', status: 'Confirmado' });

    await navigateToTab(p2, 'entradas');
    await openNewEntryDrawer(p2, 'entrada');
    await fillAndSaveEntry(p2, { nome: b, valor: '1100,00', status: 'Confirmado' });

    await p1.waitForTimeout(2_000);

    const dbA = await findItemInDB(a);
    const dbB = await findItemInDB(b);
    expect(dbA.found).toBeTruthy();
    expect(dbB.found).toBeTruthy();

    await ctx1.close();
    await ctx2.close();
  });

  test('T3: Auto items are stable (tax + recurring)', async ({ page }) => {
    const name = uniqueName('MIX09_AUTO');

    await login(page);
    await waitForSync(page);

    await navigateToTab(page, 'fixos');
    await openNewEntryDrawer(page);
    await fillAndSaveEntry(page, {
      nome: name,
      valor: '450,00',
      status: 'Confirmado',
      recorrente: 'mensal',
    });

    await navigateToTab(page, 'projecoes');
    await page.waitForTimeout(1_000);
    const autoTaxRow = page.locator('tr[data-auto-id^="proj:auto:"]');
    const initialAutoCount = await autoTaxRow.count();
    await page.waitForTimeout(22_000);
    const afterPollCount = await autoTaxRow.count();
    expect(afterPollCount).toBe(initialAutoCount);

    await navigateToTab(page, 'fixos');
    await page.fill('#search-gastos', name);
    const filteredCount = await page.locator('#table-body tr').count();
    expect(filteredCount).toBeGreaterThanOrEqual(12);
  });
});
