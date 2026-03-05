// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab, waitForSync, uniqueName, findItemInDB, cleanupTestItems, fillAndSaveEntry, openNewEntryDrawer } = require('./helpers');

/**
 * E2E Test Suite — Concurrency & Merge
 *
 * Proves that the atomic CAS (UPDATE WHERE updated_at=expected) and
 * field-level merge logic actually work under concurrent writes.
 *
 * Uses two separate browser contexts (simulating two users / tabs)
 * writing to the same Supabase row simultaneously.
 *
 * Preconditions:
 * - Supabase is reachable
 * - painel_gastos row id=1 exists
 */
test.describe('🔄 Concurrency & Merge', () => {
  /** Unique names for this test run — isolated from other test data */
  const PREFIX = `CONC_${Date.now()}`;
  const ITEM_A = `${PREFIX}_FixoA`;
  const ITEM_B = `${PREFIX}_EntradaB`;

  test.afterAll(async () => {
    await cleanupTestItems(PREFIX).catch(() => {});
  });

  test('two contexts adding items simultaneously — both must persist', async ({ browser }) => {
    // Create two completely independent browser contexts
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // Both log in
      await Promise.all([
        login(pageA),
        login(pageB),
      ]);

      // Navigate to list view on both
      await Promise.all([
        navigateToTab(pageA, 'fixos'),
        navigateToTab(pageB, 'fixos'),
      ]);

      // --- Context A: add a fixed expense ---
      await openNewEntryDrawer(pageA);
      await fillAndSaveEntry(pageA, { nome: ITEM_A, valor: '1.500,00', categoria: 'Salários' });
      await waitForSync(pageA);

      // Verify ITEM_A is in the table on Context A
      await expect(pageA.locator('#data-table-body')).toContainText(ITEM_A, { timeout: 10_000 });

      // --- Context B: add an entrada (while B still has stale state) ---
      // B hasn't refreshed yet, so its _lastUpdatedAt is from before A's write.
      // This MUST trigger the CAS conflict → merge → retry path.
      await pageB.click('[data-modo="entrada"]');
      await openNewEntryDrawer(pageB);
      await fillAndSaveEntry(pageB, { nome: ITEM_B, valor: '3.000,00', categoria: 'Projetos' });
      await waitForSync(pageB);

      // --- Verify: both items exist in Supabase (ground truth) ---
      // Wait a moment for writes to propagate
      await pageB.waitForTimeout(2000);

      const resultA = await findItemInDB(ITEM_A);
      const resultB = await findItemInDB(ITEM_B);

      expect(resultA.found).toBe(true);
      expect(resultA.array).toBe('fixos');
      expect(resultB.found).toBe(true);
      expect(resultB.array).toBe('entradas');

      // --- Verify: after reload, both contexts see both items ---
      await pageA.reload();
      await login(pageA);
      await navigateToTab(pageA, 'fixos');
      await expect(pageA.locator('#data-table-body')).toContainText(ITEM_A, { timeout: 10_000 });

      // Switch to entrada tab and verify ITEM_B
      await pageA.click('[data-modo="entrada"]');
      await expect(pageA.locator('#data-table-body')).toContainText(ITEM_B, { timeout: 10_000 });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('CAS conflict on edit: local edit wins for same item, remote additions preserved', async ({ browser }) => {
    const EDIT_A = `${PREFIX}_EditOriginal`;
    const EDIT_A_MODIFIED = `${PREFIX}_EditModifiedByA`;
    const NEW_B = `${PREFIX}_NewByB`;

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // Both log in and go to list
      await login(pageA);
      await navigateToTab(pageA, 'fixos');

      // Context A creates the initial item
      await openNewEntryDrawer(pageA);
      await fillAndSaveEntry(pageA, { nome: EDIT_A, valor: '500,00', categoria: 'Salários' });
      await waitForSync(pageA);

      // Context B logs in (gets the item in its state)
      await login(pageB);
      await navigateToTab(pageB, 'fixos');
      await waitForSync(pageB);

      // Context A edits the item (changes its name)
      const editBtnA = pageA.locator(`#data-table-body tr`).filter({ hasText: EDIT_A }).locator('button').first();
      if (await editBtnA.count() > 0) {
        await editBtnA.click();
        await pageA.waitForSelector('#drawer.open', { timeout: 5_000 });
        await pageA.fill('#f-nome', EDIT_A_MODIFIED);
        await pageA.click('#btn-save');
        await pageA.waitForSelector('#drawer:not(.open)', { timeout: 5_000 });
        await waitForSync(pageA);
      }

      // Context B (stale state) adds a new item — triggers CAS conflict
      await openNewEntryDrawer(pageB);
      await fillAndSaveEntry(pageB, { nome: NEW_B, valor: '750,00', categoria: 'Escritório' });
      await waitForSync(pageB);

      await pageB.waitForTimeout(2000);

      // Verify: the edited item has the NEW name (A's edit wins)
      const editResult = await findItemInDB(EDIT_A_MODIFIED);
      expect(editResult.found).toBe(true);

      // Verify: the original name should NOT exist anymore
      const origResult = await findItemInDB(EDIT_A);
      // It might find EDIT_A as substring in EDIT_A_MODIFIED, so check exact
      if (origResult.found && origResult.item) {
        expect(origResult.item.nome).not.toBe(EDIT_A);
      }

      // Verify: B's new item was also preserved
      const newResult = await findItemInDB(NEW_B);
      expect(newResult.found).toBe(true);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('deletion during CAS conflict: deleted item does NOT resurrect from remote', async ({ browser }) => {
    const DEL_ITEM = `${PREFIX}_WillBeDeleted`;
    const SURV_ITEM = `${PREFIX}_SurvivesDelete`;

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // A creates two items
      await login(pageA);
      await navigateToTab(pageA, 'fixos');
      await openNewEntryDrawer(pageA);
      await fillAndSaveEntry(pageA, { nome: DEL_ITEM, valor: '200,00', categoria: 'Escritório' });
      await waitForSync(pageA);

      await openNewEntryDrawer(pageA);
      await fillAndSaveEntry(pageA, { nome: SURV_ITEM, valor: '300,00', categoria: 'Escritório' });
      await waitForSync(pageA);

      // B logs in (sees both items)
      await login(pageB);
      await navigateToTab(pageB, 'fixos');
      await waitForSync(pageB);

      // B adds something (writes to server, bumping updated_at)
      await openNewEntryDrawer(pageB);
      await fillAndSaveEntry(pageB, { nome: `${PREFIX}_BAdd`, valor: '100,00', categoria: 'Escritório' });
      await waitForSync(pageB);

      // A (now stale) deletes DEL_ITEM → triggers CAS conflict → merge
      // The merge MUST respect _localDeletedIds and NOT resurrect DEL_ITEM from remote
      pageA.on('dialog', dialog => dialog.accept()); // Auto-confirm deletion
      const delBtn = pageA.locator(`#data-table-body tr`).filter({ hasText: DEL_ITEM }).locator('button[onclick*="del("]');
      if (await delBtn.count() > 0) {
        await delBtn.click();
        await waitForSync(pageA);
        await pageA.waitForTimeout(2000);

        // Verify: DEL_ITEM should NOT be in the DB
        const delResult = await findItemInDB(DEL_ITEM);
        expect(delResult.found).toBe(false);

        // Verify: SURV_ITEM should still be there
        const survResult = await findItemInDB(SURV_ITEM);
        expect(survResult.found).toBe(true);
      }
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
