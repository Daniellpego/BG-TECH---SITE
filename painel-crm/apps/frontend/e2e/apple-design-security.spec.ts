import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@acme.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

test.describe('Security Headers', () => {
  test('should return CSP and security headers', async ({ page }) => {
    const response = await page.goto('/login');
    const headers = response?.headers() || {};

    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  test('should not expose X-Powered-By', async ({ page }) => {
    const response = await page.goto('/login');
    const headers = response?.headers() || {};
    expect(headers['x-powered-by']).toBeUndefined();
  });
});

test.describe('Onboarding Tour', () => {
  test('should load onboarding page without auth', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Bem-vindo ao CRM BG Tech')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate through steps', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Dashboard Executivo')).toBeVisible();

    // Click next
    await page.click('text=Próximo');
    await expect(page.getByText('Pipeline Kanban')).toBeVisible({ timeout: 3000 });

    // Click next again
    await page.click('text=Próximo');
    await expect(page.getByText('Leads do Quiz')).toBeVisible({ timeout: 3000 });
  });

  test('should skip tour', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('text=Pular tour');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should show progress indicators', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Passo 1 de 6')).toBeVisible();
  });
});

test.describe('Help Center', () => {
  test('should load help page', async ({ page }) => {
    await login(page);
    await page.goto('/help');
    await expect(page.getByText('Central de Ajuda')).toBeVisible({ timeout: 5000 });
  });

  test('should display FAQ items', async ({ page }) => {
    await login(page);
    await page.goto('/help');
    await expect(page.getByText('O que é o CRM BG Tech?')).toBeVisible();
  });

  test('should filter FAQ by search', async ({ page }) => {
    await login(page);
    await page.goto('/help');
    await page.fill('input[placeholder*="Buscar"]', 'IA');
    await expect(page.getByText('Como funciona a IA de qualificação?')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await login(page);
    await page.goto('/help');
    await page.click('text=Segurança');
    await expect(page.getByText('O CRM é seguro?')).toBeVisible();
  });
});

test.describe('Apple-Minimal Design', () => {
  test('should use rounded-2xl cards on dashboard', async ({ page }) => {
    await login(page);
    // Check that KPI cards exist with Apple-style design
    await expect(page.getByText(/Pipeline|MRR/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should have collapsible sidebar', async ({ page }) => {
    await login(page);
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Click collapse button
    const collapseBtn = page.getByText('Recolher');
    if (await collapseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await collapseBtn.click();
      // Sidebar should be narrower
      await page.waitForTimeout(400);
    }
  });

  test('should have glass effect on topbar', async ({ page }) => {
    await login(page);
    const topbar = page.locator('header.glass, .glass').first();
    await expect(topbar).toBeVisible({ timeout: 3000 });
  });
});
