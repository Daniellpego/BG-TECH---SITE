// @ts-check

/**
 * Helper utilities for Painel CFO E2E tests.
 * 
 * Provides login, navigation, waiting, and assertion helpers
 * so that test specs stay clean and declarative.
 * 
 * For direct DB verification, tests use the service_role key
 * (set via SUPABASE_SERVICE_ROLE_KEY env var) or fall back
 * to the API proxy endpoints for read operations.
 */

/** Default credentials for testing */
const CREDENTIALS = { user: 'daniel', pass: 'admin2024' };

/** Supabase REST config for direct DB verification in tests */
const SUPABASE = {
  url: process.env.SUPABASE_URL || 'https://urpuiznydrlwmaqhdids.supabase.co',
  // Tests use service_role key for direct verification (bypasses RLS).
  // Falls back to anon key ONLY if RLS not yet enabled in test environment.
  key: process.env.SUPABASE_SERVICE_ROLE_KEY 
    || process.env.SUPABASE_ANON_KEY 
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycHVpem55ZHJsd21hcWhkaWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjQ0OTIsImV4cCI6MjA4NzIwMDQ5Mn0.qSoyYmBTvgdOAickkuLCYCveOj2ELIZt85LFZb6veQ8',
};

/** API proxy base URL for tests (local server) */
const API_BASE = process.env.API_BASE || 'http://localhost:5500/api/painel';

/**
 * Generates a unique name with prefix for test isolation.
 * @param {string} prefix - e.g. 'TEST_FIXO', 'TEST_ENTRADA'
 * @returns {string}
 */
function uniqueName(prefix = 'TEST') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Fetches the current painel_gastos row directly from Supabase REST API.
 * Bypasses the UI entirely — the ground truth for persistence tests.
 * @returns {Promise<object>}
 */
async function fetchRowDirect() {
  const res = await fetch(
    `${SUPABASE.url}/rest/v1/painel_gastos?id=eq.1&select=*`,
    {
      headers: {
        apikey: SUPABASE.key,
        Authorization: `Bearer ${SUPABASE.key}`,
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  if (!rows.length) throw new Error('Row id=1 not found in painel_gastos');
  return rows[0];
}

/**
 * Searches all arrays in painel_gastos for an item by name (substring match).
 * @param {string} name
 * @returns {Promise<{ found: boolean, array: string|null, item: object|null }>}
 */
async function findItemInDB(name) {
  const row = await fetchRowDirect();
  for (const arrKey of ['fixos', 'unicos', 'entradas']) {
    const arr = Array.isArray(row[arrKey]) ? row[arrKey] : [];
    const item = arr.find(i => i && i.nome && i.nome.includes(name));
    if (item) return { found: true, array: arrKey, item };
  }
  // Check projecoes
  const proj = row.projecoes || {};
  for (const arrKey of ['entradas', 'saidas']) {
    const arr = Array.isArray(proj[arrKey]) ? proj[arrKey] : [];
    const item = arr.find(i => i && i.nome && i.nome.includes(name));
    if (item) return { found: true, array: `projecoes.${arrKey}`, item };
  }
  return { found: false, array: null, item: null };
}

/**
 * Removes test items from DB (cleanup). Directly mutates via Supabase REST.
 * @param {string} namePrefix - Prefix to match (e.g. 'TEST_')
 */
async function cleanupTestItems(namePrefix = 'TEST_') {
  const row = await fetchRowDirect();
  const filterArr = (arr) => (Array.isArray(arr) ? arr : []).filter(
    i => !(i && i.nome && i.nome.includes(namePrefix))
  );
  const payload = {
    fixos: filterArr(row.fixos),
    unicos: filterArr(row.unicos),
    entradas: filterArr(row.entradas),
    projecoes: {
      entradas: filterArr((row.projecoes || {}).entradas),
      saidas: filterArr((row.projecoes || {}).saidas),
    },
    updated_at: new Date().toISOString(),
  };
  const res = await fetch(
    `${SUPABASE.url}/rest/v1/painel_gastos?id=eq.1`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE.key,
        Authorization: `Bearer ${SUPABASE.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(`Cleanup failed: ${res.status}`);
}

/**
 * Performs login and waits for the app to be visible.
 * @param {import('@playwright/test').Page} page
 * @param {{ user?: string, pass?: string }} [creds]
 */
async function login(page, creds = {}) {
  const { user, pass } = { ...CREDENTIALS, ...creds };
  await page.goto('/?debug=1');
  await page.waitForSelector('#login-screen', { state: 'visible', timeout: 10_000 });
  await page.fill('#lu', user);
  await page.fill('#lp', pass);
  await page.click('#btn-login');
  // Wait for app to become visible (transition takes ~500ms)
  await page.waitForSelector('#app.visible', { state: 'visible', timeout: 10_000 });
}

/**
 * Navigates to a tab by clicking the sidebar button.
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - e.g. 'overview', 'dre', 'fixos', 'projecoes'
 */
async function navigateToTab(page, tabName) {
  await page.click(`[data-tab="${tabName}"]`);
  // Wait for view to be active
  const viewId = (tabName === 'fixos' || tabName === 'unicos') ? 'view-list' : `view-${tabName}`;
  await page.waitForSelector(`#${viewId}.active`, { timeout: 5_000 });
}

/**
 * Waits for the sync indicator to show "ok" state (green dot).
 * @param {import('@playwright/test').Page} page
 */
async function waitForSync(page) {
  await page.waitForFunction(() => {
    const txt = document.getElementById('sync-txt');
    return txt && txt.textContent.includes('Conectada');
  }, { timeout: 15_000 }).catch(() => {
    // Sync may not connect in test env — that's OK
  });
}

/**
 * Gets the text content of a KPI value element.
 * @param {import('@playwright/test').Page} page 
 * @param {string} id - Element ID, e.g. 'v-caixa'
 * @returns {Promise<string>}
 */
async function getKPIValue(page, id) {
  return page.locator(`#${id}`).textContent();
}

/**
 * Opens the drawer for a new entry (despesa or entrada).
 * @param {import('@playwright/test').Page} page
 */
async function openNewEntryDrawer(page, modo = null) {
  await page.click('#btn-add-main');
  await page.waitForSelector('#drawer.open', { timeout: 5_000 });
  if (modo === 'entrada') {
    await page.click('#tab-modo-entrada');
  } else if (modo === 'despesa') {
    await page.click('#tab-modo-despesa');
  }
}

/**
 * Fills the entry form and saves.
 * @param {import('@playwright/test').Page} page
 * @param {{ nome: string, valor: string, categoria?: string, status?: string, recorrente?: string }} entry
 */
async function fillAndSaveEntry(page, entry) {
  await page.fill('#f-nome', entry.nome);
  await page.fill('#f-valor', entry.valor);
  if (entry.categoria) {
    await page.selectOption('#f-cat', entry.categoria);
  }
  if (entry.status) {
    await page.selectOption('#f-status', entry.status);
  }
  if (entry.recorrente) {
    await page.selectOption('#f-recor', entry.recorrente);
  }
  await page.click('#btn-save');
  // Wait for drawer to close
  await page.waitForSelector('#drawer:not(.open)', { timeout: 5_000 });
}

module.exports = { CREDENTIALS, SUPABASE, API_BASE, login, navigateToTab, waitForSync, getKPIValue, openNewEntryDrawer, fillAndSaveEntry, uniqueName, fetchRowDirect, findItemInDB, cleanupTestItems };
