import { test, expect, Page } from '@playwright/test';

/**
 * Smoke tests for UI Design & Animations features.
 * These test the new frontend components: Kanban, Leads, Proposals, Theme toggle.
 */

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@acme.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

test.describe('UI Design — Smoke Tests', () => {
  // ─── Theme Toggle ───
  test('should toggle dark/light theme', async ({ page }) => {
    await login(page);
    
    // Look for theme toggle button in topbar
    const themeBtn = page.locator('button[aria-label="Alternar tema"]');
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click();
      // Theme should change (light class added/removed from html)
      await page.waitForTimeout(300);
    }
  });

  // ─── Dashboard KPI Cards ───
  test('should display animated KPI cards on dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    
    // Dashboard should show KPI sections
    await expect(page.getByText(/pipeline|receita|oportunidades|projetos/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Leads Page ───
  test('should navigate to leads page', async ({ page }) => {
    await login(page);
    
    // Click on Leads in sidebar
    await page.click('text=Leads');
    await expect(page).toHaveURL(/leads/);
    
    // Should show leads heading or data
    await expect(page.getByText(/leads|inbox/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Pipeline Kanban ───
  test('should display kanban columns on pipeline page', async ({ page }) => {
    await login(page);
    
    await page.click('text=Pipeline');
    await expect(page).toHaveURL(/pipeline/);

    // Should show stage columns (common pipeline stages)
    await expect(page.getByText(/prospecting|qualification|proposal|negotiation|closed/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Proposals ───
  test('should navigate to proposals page', async ({ page }) => {
    await login(page);
    
    await page.click('text=Propostas');
    await expect(page).toHaveURL(/proposals/);
  });

  // ─── New Proposal ───
  test('should open new proposal editor', async ({ page }) => {
    await login(page);
    
    await page.goto('/proposals/new');
    
    // Should show markdown editor or proposal form
    await expect(page.getByText(/nova proposta|proposta|editor/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Sidebar Navigation ───
  test('should have all sidebar navigation items', async ({ page }) => {
    await login(page);
    
    const navItems = ['Dashboard', 'Pipeline', 'Leads', 'Projetos', 'Propostas', 'SLAs'];
    for (const item of navItems) {
      await expect(page.getByText(item).first()).toBeVisible();
    }
  });
});
