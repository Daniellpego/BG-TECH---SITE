// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab, waitForSync, uniqueName, fetchRowDirect, findItemInDB, cleanupTestItems, openNewEntryDrawer, fillAndSaveEntry, SUPABASE } = require('./helpers');

/**
 * E2E Test Suite — Persistence Proof
 *
 * Proves that data actually reaches Supabase and survives:
 * 1. Full page reload (not from cache/localStorage)
 * 2. Brand-new browser context (no session state)
 * 3. Direct REST verification (bypasses UI entirely)
 * 4. Tab switch cycles
 * 5. Offline save fails with alert (doesn't pretend success)
 *
 * This is the "show me the money" suite — if these pass,
 * the data is truly persistent, not just in-memory illusion.
 */
test.describe('💾 Persistence Proof', () => {
  const PREFIX = `PERS_${Date.now()}`;
  const ITEM_NAME = `${PREFIX}_FixoProof`;
  const ITEM_VALOR = '2.750,00';

  test.afterAll(async () => {
    await cleanupTestItems(PREFIX).catch(() => {});
  });

  test('create item → verify via direct Supabase REST (bypasses UI)', async ({ page }) => {
    await login(page);
    await navigateToTab(page, 'fixos');

    // Create the item
    await openNewEntryDrawer(page);
    await fillAndSaveEntry(page, { nome: ITEM_NAME, valor: ITEM_VALOR, categoria: 'Salários' });
    await waitForSync(page);

    // Wait for push to complete
    await page.waitForTimeout(2000);

    // Direct REST check — completely bypasses the UI
    const result = await findItemInDB(ITEM_NAME);
    expect(result.found).toBe(true);
    expect(result.array).toBe('fixos');
    expect(result.item).toBeTruthy();
    expect(result.item.nome).toContain(ITEM_NAME);
    expect(result.item.valor).toBeTruthy();
    // Verify item has an ID (backfill or genId worked)
    expect(result.item.id).toBeTruthy();
    expect(typeof result.item.id).toBe('string');
  });

  test('item survives full page reload (proves not from localStorage/cache)', async ({ page }) => {
    // Pre-condition: ITEM_NAME was created in previous test
    // But to be safe, create it fresh if not found
    await login(page);
    await navigateToTab(page, 'fixos');

    const preCheck = await findItemInDB(ITEM_NAME);
    if (!preCheck.found) {
      await openNewEntryDrawer(page);
      await fillAndSaveEntry(page, { nome: ITEM_NAME, valor: ITEM_VALOR, categoria: 'Salários' });
      await waitForSync(page);
      await page.waitForTimeout(2000);
    }

    // Full reload — clears all JS state, no localStorage in this app
    await page.reload({ waitUntil: 'networkidle' });

    // Must re-login (state is gone)
    await login(page);
    await navigateToTab(page, 'fixos');
    await waitForSync(page);

    // The item must still be there (fetched fresh from Supabase)
    await expect(page.locator('#data-table-body')).toContainText(ITEM_NAME, { timeout: 15_000 });
  });

  test('item visible in brand-new browser context (proves server-side persistence)', async ({ browser }) => {
    // Create a completely fresh browser context — no cookies, no session, no state
    const freshCtx = await browser.newContext();
    const freshPage = await freshCtx.newPage();

    try {
      await login(freshPage);
      await navigateToTab(freshPage, 'fixos');
      await waitForSync(freshPage);

      // The item must be visible — freshPage has NO prior state
      await expect(freshPage.locator('#data-table-body')).toContainText(ITEM_NAME, { timeout: 15_000 });
    } finally {
      await freshCtx.close();
    }
  });

  test('item persists across tab switch cycle (overview → list → projecoes → back)', async ({ page }) => {
    await login(page);
    await navigateToTab(page, 'fixos');
    await waitForSync(page);

    // Verify item is in fixos
    await expect(page.locator('#data-table-body')).toContainText(ITEM_NAME, { timeout: 10_000 });

    // Switch to overview
    await navigateToTab(page, 'overview');
    await page.waitForTimeout(500);

    // Switch to projecoes
    await navigateToTab(page, 'projecoes');
    await page.waitForTimeout(500);

    // Switch back to fixos
    await navigateToTab(page, 'fixos');

    // Item MUST still be there (wasn't lost during tab switches)
    await expect(page.locator('#data-table-body')).toContainText(ITEM_NAME, { timeout: 10_000 });
  });

  test('fetchSync pulls from Supabase, NOT from cache or localStorage', async ({ page }) => {
    await login(page);
    await waitForSync(page);

    // Verify the app does NOT use localStorage
    const hasLocalStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(k => k.includes('painel') || k.includes('gastos') || k.includes('cfo'));
    });
    expect(hasLocalStorage).toBe(false);

    // Verify the app makes actual network requests to the API proxy (not direct Supabase)
    const apiRequests = [];
    page.on('request', req => {
      if (req.url().includes('/api/painel')) {
        apiRequests.push(req.url());
      }
    });

    // Trigger a fetchSync via reload + login
    await page.reload({ waitUntil: 'networkidle' });
    await login(page);
    await waitForSync(page);

    // At least one request to /api/painel must have been made
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('updated_at changes after each push (proves write went through)', async ({ page }) => {
    const ITEM_TS = `${PREFIX}_TimestampCheck`;

    await login(page);
    await navigateToTab(page, 'fixos');

    // Record timestamp before
    const before = await fetchRowDirect();
    const tsBefore = before.updated_at;

    // Create an item
    await openNewEntryDrawer(page);
    await fillAndSaveEntry(page, { nome: ITEM_TS, valor: '100,00', categoria: 'Escritório' });
    await waitForSync(page);
    await page.waitForTimeout(2000);

    // Record timestamp after
    const after = await fetchRowDirect();
    const tsAfter = after.updated_at;

    // Timestamps must differ (proves the write happened)
    expect(tsAfter).not.toBe(tsBefore);
    expect(new Date(tsAfter).getTime()).toBeGreaterThan(new Date(tsBefore).getTime());
  });

  test('offline save shows error toast and does NOT pretend success', async ({ page, context }) => {
    await login(page);
    await navigateToTab(page, 'fixos');
    await waitForSync(page);

    // Block all API requests to simulate offline
    await context.route('**/api/painel**', route => route.abort());

    // Try to save an item
    await openNewEntryDrawer(page);
    await page.fill('#f-nome', `${PREFIX}_OfflineTest`);
    await page.fill('#f-valor', '50,00');
    await page.click('#btn-save');

    // The sync indicator must show error state (red dot)
    await expect(page.locator('#sync-txt')).toContainText('Offline', { timeout: 10_000 });

    // Error toast must be visible
    await expect(page.locator('.toast')).toContainText(/Erro|Offline/i, { timeout: 5_000 });

    // Unblock for cleanup
    await context.unroute('**/api/painel**');
  });

  test('direct REST: painel_gastos row has all required JSONB arrays', async () => {
    // Pure server-side validation — no browser needed
    const row = await fetchRowDirect();

    // Structural validation
    expect(Array.isArray(row.fixos)).toBe(true);
    expect(Array.isArray(row.unicos)).toBe(true);
    expect(Array.isArray(row.entradas)).toBe(true);
    expect(row.projecoes).toBeTruthy();
    expect(Array.isArray(row.projecoes.entradas)).toBe(true);
    expect(Array.isArray(row.projecoes.saidas)).toBe(true);
    expect(row.updated_at).toBeTruthy();

    // Every item in every array must have an .id (backfill test)
    const allItems = [
      ...row.fixos, ...row.unicos, ...row.entradas,
      ...(row.projecoes.entradas || []), ...(row.projecoes.saidas || [])
    ];
    for (const item of allItems) {
      expect(item.id).toBeTruthy();
      expect(typeof item.id).toBe('string');
    }
  });
});
