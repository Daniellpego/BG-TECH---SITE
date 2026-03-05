/**
 * Vercel Serverless API — Painel CFO Proxy
 * 
 * This function sits between the frontend and Supabase, ensuring:
 * 1. The anon key never touches the database directly
 * 2. service_role key stays server-side only
 * 3. RLS blocks any direct anon access
 * 4. All CAS logic (atomic UPDATE WHERE updated_at=expected) executes server-side
 *
 * Endpoints:
 *   GET  /api/painel           → returns row id=1
 *   POST /api/painel           → atomic CAS update (expects updated_at in body)
 *   POST /api/painel?init=1    → upsert for first-push (no CAS check)
 *
 * Environment variables required:
 *   SUPABASE_URL               → e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  → service_role JWT (NEVER expose to client)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

/** Low-level fetch wrapper for Supabase REST */
async function supabaseREST(method, query = '', body = null, extraHeaders = {}) {
  const url = `${SUPABASE_URL}/rest/v1/painel_gastos${query}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  return { status: res.status, ok: res.ok, data };
}

module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // ═══════════════════════════════════════════
    // GET /api/painel — Read row id=1
    // ═══════════════════════════════════════════
    if (req.method === 'GET') {
      const result = await supabaseREST('GET', '?id=eq.1&select=*');
      if (!result.ok) {
        return res.status(result.status).json({ error: 'Supabase read failed', detail: result.data });
      }
      const rows = Array.isArray(result.data) ? result.data : [];
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Row id=1 not found' });
      }
      return res.status(200).json(rows[0]);
    }

    // ═══════════════════════════════════════════
    // POST /api/painel — Write with atomic CAS
    // ═══════════════════════════════════════════
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }

      const { fixos, unicos, entradas, projecoes, caixa_disponivel, updated_at, expected_updated_at } = body;

      // Validate required fields
      if (!Array.isArray(fixos) || !Array.isArray(unicos) || !Array.isArray(entradas)) {
        return res.status(400).json({ error: 'fixos, unicos, entradas must be arrays' });
      }
      if (!projecoes || typeof projecoes !== 'object') {
        return res.status(400).json({ error: 'projecoes must be an object' });
      }

      const payload = {
        fixos,
        unicos,
        entradas,
        projecoes,
        caixa_disponivel: Number(caixa_disponivel) || 0,
        updated_at: updated_at || new Date().toISOString(),
      };

      const isInit = req.query.init === '1';

      if (isInit || !expected_updated_at) {
        // ── UPSERT (first push — no prior state) ──
        payload.id = 1;
        const result = await supabaseREST(
          'POST',
          '?on_conflict=id',
          payload,
          { Prefer: 'return=representation,resolution=merge-duplicates' }
        );
        if (!result.ok) {
          return res.status(result.status).json({ error: 'Upsert failed', detail: result.data });
        }
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return res.status(200).json({
          success: true,
          updated_at: row?.updated_at || payload.updated_at,
          cas: false,
        });
      }

      // ── ATOMIC CAS: UPDATE WHERE id=1 AND updated_at = expected ──
      const result = await supabaseREST(
        'PATCH',
        `?id=eq.1&updated_at=eq.${encodeURIComponent(expected_updated_at)}`,
        payload,
        { Prefer: 'return=representation' }
      );

      if (!result.ok) {
        return res.status(result.status).json({ error: 'CAS update failed', detail: result.data });
      }

      const rows = Array.isArray(result.data) ? result.data : [];

      if (rows.length === 0) {
        // ── CONFLICT: 0 rows matched → another session wrote ──
        // Fetch current server state so frontend can merge
        const current = await supabaseREST('GET', '?id=eq.1&select=*');
        const currentRow = Array.isArray(current.data) ? current.data[0] : null;

        return res.status(409).json({
          error: 'CAS_CONFLICT',
          message: 'Row was modified by another session',
          expected: expected_updated_at,
          actual: currentRow?.updated_at || null,
          current: currentRow || null,
        });
      }

      // ── SUCCESS ──
      return res.status(200).json({
        success: true,
        updated_at: rows[0]?.updated_at || payload.updated_at,
        cas: true,
      });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });

  } catch (err) {
    console.error('API /api/painel error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
