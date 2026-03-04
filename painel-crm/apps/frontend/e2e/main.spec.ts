import { test, expect } from '@playwright/test';

test.describe('CRM BG Tech — E2E Flows', () => {
  // ─── Login Flow ───
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('CRM BG Tech')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Senha')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bad@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.getByText(/erro|invalid|falha/i)).toBeVisible({ timeout: 5000 });
  });

  // ─── Dashboard Flow ───
  test('should display dashboard KPIs after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Check KPIs are visible
    await expect(page.getByText(/Pipeline/i)).toBeVisible();
    await expect(page.getByText(/Oportunidades|Opportunities/i)).toBeVisible();
  });

  // ─── Pipeline Flow ───
  test('should navigate to pipeline page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Navigate to pipeline
    await page.click('text=Pipeline');
    await expect(page).toHaveURL(/pipeline/);
  });

  // ─── SLA Page ───
  test('should display SLA page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.click('text=SLAs');
    await expect(page).toHaveURL(/sla/);
  });
});
