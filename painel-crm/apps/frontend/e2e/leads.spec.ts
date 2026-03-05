import { test, expect } from '@playwright/test';

test.describe('Leads Quiz Integration', () => {
  test('should create lead via API and see in inbox', async ({ request, page }) => {
    // Insert lead via API
    const token = process.env.TEST_TOKEN;
    const res = await request.post('/api/leads', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        nome: 'Teste Playwright',
        empresa: 'ACME',
        whatsapp: '+551199999999',
        segmento: 'Industrial',
        faturamento: '5000000',
        tenant_id: 'tenant_a_test',
        consent: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const lead = await res.json();
    expect(lead.nome).toBe('Teste Playwright');

    // Go to leads inbox
    await page.goto('/leads');
    await expect(page.getByText('Teste Playwright')).toBeVisible({ timeout: 2000 });
  });

  test('should process lead and show qualification', async ({ page }) => {
    await page.goto('/leads');
    await page.click('text=Teste Playwright');
    await expect(page.getByText(/Resultado da Qualificação/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/hot|warm|cold|disqualified/)).toBeVisible();
  });
});
