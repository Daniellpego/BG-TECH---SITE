// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateToTab, openNewEntryDrawer, fillAndSaveEntry } = require('./helpers');

/**
 * E2E Test Suite — CRUD Operations
 * 
 * Tests creation, editing, deletion of entries (despesas, receitas, projeções).
 * Validates form validation, recurrence generation, and drawer behavior.
 */
test.describe('✏️ CRUD Operations', () => {
  const jsErrors = [];

  test.beforeEach(async ({ page }) => {
    jsErrors.length = 0;
    page.on('pageerror', err => jsErrors.push(err.message));
    await login(page);
  });

  test.afterEach(async () => {
    expect(jsErrors, `Unexpected JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test.describe('Despesas (Custos Fixos/Variáveis)', () => {
    test('should open drawer for new despesa', async ({ page }) => {
      await navigateToTab(page, 'fixos');
      await openNewEntryDrawer(page);
      
      await expect(page.locator('#drawer')).toHaveClass(/open/);
      await expect(page.locator('#drawer-title')).toHaveText('Novo Lançamento');
    });

    test('should reject empty form submission', async ({ page }) => {
      await navigateToTab(page, 'fixos');
      await openNewEntryDrawer(page);
      
      // Try to save without filling anything
      await page.click('#btn-save');
      
      // Drawer should still be open (save rejected)
      await expect(page.locator('#drawer')).toHaveClass(/open/);
      // Error toast should appear
      await expect(page.locator('.toast.err')).toBeVisible({ timeout: 3_000 });
    });

    test('should create a fixed cost entry', async ({ page }) => {
      await navigateToTab(page, 'fixos');
      await openNewEntryDrawer(page);

      await page.click('#tab-modo-despesa');
      await page.click('#tab-fixos');
      await fillAndSaveEntry(page, {
        nome: 'E2E Test - Aluguel Coworking',
        valor: '1.500,00',
        categoria: 'Outros Custos Fixos',
        status: 'Confirmado',
      });

      // Verify entry appears in the table
      await expect(page.locator('#table-body')).toContainText('E2E Test - Aluguel Coworking');
    });

    test('should create a variable cost entry', async ({ page }) => {
      await navigateToTab(page, 'unicos');
      await openNewEntryDrawer(page);

      await page.click('#tab-modo-despesa');
      await page.click('#tab-unicos');
      await fillAndSaveEntry(page, {
        nome: 'E2E Test - Campanha Google Ads',
        valor: '800,00',
        categoria: 'Marketing (Tráfego, Campanhas)',
        status: 'Confirmado',
      });

      await expect(page.locator('#table-body')).toContainText('E2E Test - Campanha Google Ads');
    });

    test('should delete an entry', async ({ page }) => {
      await navigateToTab(page, 'fixos');
      await openNewEntryDrawer(page);

      // Create entry first
      await page.click('#tab-modo-despesa');
      await page.click('#tab-fixos');
      await fillAndSaveEntry(page, {
        nome: 'E2E Test - Delete Me',
        valor: '100,00',
        status: 'Confirmado',
      });

      // Verify it exists
      await expect(page.locator('#table-body')).toContainText('E2E Test - Delete Me');

      // Click delete button on the entry
      page.on('dialog', dialog => dialog.accept());
      const deleteBtn = page.locator('#table-body tr').filter({ hasText: 'E2E Test - Delete Me' }).locator('button[onclick*="del"]');
      await deleteBtn.click();

      // Wait for deletion
      await page.waitForTimeout(1000);
      
      // Verify entry is gone
      await expect(page.locator('#table-body')).not.toContainText('E2E Test - Delete Me');
    });
  });

  test.describe('Receitas (Entradas)', () => {
    test('should create a revenue entry', async ({ page }) => {
      await navigateToTab(page, 'entradas');
      await openNewEntryDrawer(page);

      // Switch to "entrada" mode
      await page.click('#tab-modo-entrada');
      await fillAndSaveEntry(page, {
        nome: 'E2E Test - Cliente Acme Mensalidade',
        valor: '3.000,00',
        categoria: 'Receita de Mensalidades (Recorrente)',
        status: 'Confirmado',
      });

      await expect(page.locator('#table-entradas')).toContainText('E2E Test - Cliente Acme Mensalidade');
    });

    test('should switch drawer mode between despesa and entrada', async ({ page }) => {
      await openNewEntryDrawer(page);

      // Default is despesa
      await expect(page.locator('#drawer-title')).toHaveText('Novo Lançamento');

      // Switch to entrada
      await page.click('#tab-modo-entrada');
      await expect(page.locator('#drawer-title')).toHaveText('Nova Receita');

      // Switch back to despesa
      await page.click('#tab-modo-despesa');
      await expect(page.locator('#drawer-title')).toHaveText('Novo Lançamento');
    });
  });

  test.describe('Projeções', () => {
    test('should open projection drawer', async ({ page }) => {
      await navigateToTab(page, 'projecoes');
      
      await page.locator('button', { hasText: 'Projetar Receita' }).click();
      await expect(page.locator('#proj-drawer')).toHaveClass(/open/);
    });

    test('should create a revenue projection', async ({ page }) => {
      await navigateToTab(page, 'projecoes');
      
      await page.locator('button', { hasText: 'Projetar Receita' }).click();
      await page.fill('#pf-nome', 'E2E Test - Projeção Receita Q1');
      await page.fill('#pf-valor', '10.000,00');
      // Set month to current month
      const now = new Date();
      const monthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await page.fill('#pf-mes', monthVal);
      await page.click('#btn-proj-save');

      // Verify in table
      await expect(page.locator('#p-table-body')).toContainText('E2E Test - Projeção Receita Q1');
    });

    test('should render quarterly breakdown table', async ({ page }) => {
      await navigateToTab(page, 'projecoes');
      
      // The quarterly breakdown should render (even if empty)
      const breakdown = page.locator('#p-quarterly-breakdown');
      // If there's any projection data, the table should appear
      await expect(breakdown).toBeVisible();
    });

    test('should change horizon and re-render', async ({ page }) => {
      await navigateToTab(page, 'projecoes');
      
      await page.selectOption('#p-horizonte', '12');
      // Should not throw any errors — the re-render happens automatically
      await page.waitForTimeout(500);
      // Verify the breakdown still renders
      await expect(page.locator('#p-quarterly-breakdown')).toBeVisible();
    });
  });
});
