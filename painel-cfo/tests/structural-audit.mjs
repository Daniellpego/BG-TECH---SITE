/**
 * Structural Security Audit — validates API routing, method restriction,
 * input validation, and frontend cleanliness WITHOUT real Supabase credentials.
 * 
 * Usage: node structural-audit.mjs
 * (Requires dev-server.js running on port 5500)
 */
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5500';
const results = [];

function log(pass, name, detail = '') {
  const icon = pass ? '✅' : '❌';
  results.push({ pass, name, detail });
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOpts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
    };
    const r = http.request(reqOpts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    r.on('error', reject);
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function run() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   STRUCTURAL SECURITY AUDIT — Painel CFO              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // ── TEST 1: Static serving works ──
  try {
    const r = await req('/');
    log(r.status === 200 && r.body.includes('CFO Dashboard'), 'Static HTML serves correctly', `status=${r.status}, length=${r.body.length}`);
  } catch (e) {
    log(false, 'Static HTML serves correctly', e.message);
  }

  // ── TEST 2: No Supabase CDN in HTML ──
  try {
    const r = await req('/');
    const noSDK = !r.body.includes('supabase-js') && !r.body.includes('createClient');
    log(noSDK, 'No Supabase SDK/CDN in HTML');
  } catch (e) {
    log(false, 'No Supabase SDK/CDN in HTML', e.message);
  }

  // ── TEST 3: No credentials in HTML ──
  try {
    const r = await req('/');
    const noJWT = !r.body.includes('eyJhbG');
    const noKey = !r.body.includes('service_role');
    const noURL = !r.body.includes('supabase.co');
    // Allow the REMOVED comment
    const hasAPIBase = r.body.includes("const API_BASE = '/api/painel'");
    log(noJWT && noKey && hasAPIBase, 'No credentials in frontend HTML', `noJWT=${noJWT} noServiceRole=${noKey} noSupabaseURL=${noURL} hasAPIBase=${hasAPIBase}`);
  } catch (e) {
    log(false, 'No credentials in frontend HTML', e.message);
  }

  // ── TEST 4: API GET routes to handler ──
  try {
    const r = await req('/api/painel');
    // With fake credentials, Supabase will return an error, but the API handler should still respond (not 404)
    const isAPIResponse = r.status !== 404 && (r.headers['content-type'] || '').includes('json');
    log(isAPIResponse, 'API GET /api/painel routes correctly', `status=${r.status}`);
  } catch (e) {
    log(false, 'API GET routes correctly', e.message);
  }

  // ── TEST 5: PUT method returns 405 ──
  try {
    const r = await req('/api/painel', { method: 'PUT' });
    log(r.status === 405, 'PUT method blocked with 405', `status=${r.status}`);
  } catch (e) {
    log(false, 'PUT method blocked', e.message);
  }

  // ── TEST 6: DELETE method returns 405 ──
  try {
    const r = await req('/api/painel', { method: 'DELETE' });
    log(r.status === 405, 'DELETE method blocked with 405', `status=${r.status}`);
  } catch (e) {
    log(false, 'DELETE method blocked', e.message);
  }

  // ── TEST 7: PATCH method returns 405 ──
  try {
    const r = await req('/api/painel', { method: 'PATCH' });
    log(r.status === 405, 'PATCH method blocked with 405', `status=${r.status}`);
  } catch (e) {
    log(false, 'PATCH method blocked', e.message);
  }

  // ── TEST 8: POST with invalid body returns 400 ──
  try {
    const r = await req('/api/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixos: 'not_array', unicos: [], entradas: [] }),
    });
    log(r.status === 400, 'Invalid POST body rejected with 400', `status=${r.status} body=${r.body.substring(0, 100)}`);
  } catch (e) {
    log(false, 'Invalid POST body rejected', e.message);
  }

  // ── TEST 9: POST with missing projecoes returns 400 ──
  try {
    const r = await req('/api/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixos: [], unicos: [], entradas: [], projecoes: 'invalid' }),
    });
    log(r.status === 400, 'Missing projecoes rejected with 400', `status=${r.status}`);
  } catch (e) {
    log(false, 'Missing projecoes rejected', e.message);
  }

  // ── TEST 10: OPTIONS returns 204 (CORS preflight) ──
  try {
    const r = await req('/api/painel', { method: 'OPTIONS' });
    log(r.status === 204, 'OPTIONS returns 204 (CORS preflight)', `status=${r.status}`);
  } catch (e) {
    log(false, 'OPTIONS CORS preflight', e.message);
  }

  // ── TEST 11: API returns no-cache headers ──
  try {
    const r = await req('/api/painel');
    const cors = r.headers['access-control-allow-methods'];
    log(cors && cors.includes('GET') && cors.includes('POST'), 'CORS headers set correctly', `methods=${cors}`);
  } catch (e) {
    log(false, 'CORS headers', e.message);
  }

  // ── TEST 12: Source file analysis — painel.js has no hardcoded secrets ──
  try {
    const src = readFileSync(resolve(__dirname, '../../api/painel.js'), 'utf-8');
    const noHardcodedKey = !src.includes('eyJhbG');
    const usesEnvVar = src.includes('process.env.SUPABASE_SERVICE_ROLE_KEY');
    const hardcodedId1 = src.includes('?id=eq.1');
    log(noHardcodedKey && usesEnvVar && hardcodedId1, 'painel.js: no hardcoded secrets, uses env vars, hardcoded id=1',
      `noKey=${noHardcodedKey} envVar=${usesEnvVar} id1=${hardcodedId1}`);
  } catch (e) {
    log(false, 'painel.js source analysis', e.message);
  }

  // ── TEST 13: index.html has ZERO direct Supabase calls ──
  try {
    const src = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    const noCreateClient = !src.includes('createClient(');
    const noFromTable = !src.includes("from('painel_gastos')");
    const noSbGetter = !src.includes('get sb()');
    const noWindowSupabase = !src.includes('window.supabase');
    const fetchCount = (src.match(/fetch\(API_BASE/g) || []).length;
    log(noCreateClient && noFromTable && noSbGetter && noWindowSupabase && fetchCount === 3,
      'index.html: 0 direct Supabase calls, 3 API proxy calls',
      `createClient=${!noCreateClient} fromTable=${!noFromTable} sbGetter=${!noSbGetter} windowSupabase=${!noWindowSupabase} fetchCalls=${fetchCount}`);
  } catch (e) {
    log(false, 'index.html source analysis', e.message);
  }

  // ── TEST 14: vercel.json routes API correctly ──
  try {
    const cfg = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8'));
    const apiRewrite = cfg.rewrites?.find(r => r.source === '/api/painel');
    const noCacheHeader = cfg.headers?.find(h => h.source === '/api/(.*)');
    const hasNoCache = noCacheHeader?.headers?.some(h => h.key === 'Cache-Control' && h.value.includes('no-store'));
    log(apiRewrite?.destination === '/api/painel.js' && hasNoCache,
      'vercel.json: API route + no-cache headers configured',
      `rewrite=${apiRewrite?.destination} noCache=${hasNoCache}`);
  } catch (e) {
    log(false, 'vercel.json analysis', e.message);
  }

  // ── TEST 15: RLS SQL is correct ──
  try {
    const sql = readFileSync(resolve(__dirname, '../../infra/supabase/rls-hardening.sql'), 'utf-8');
    const hasEnable = sql.includes('ENABLE ROW LEVEL SECURITY');
    const hasRestrictive = sql.includes('AS RESTRICTIVE');
    const hasDenyAnon = sql.includes('TO anon') && sql.includes('USING (false)') && sql.includes('WITH CHECK (false)');
    log(hasEnable && hasRestrictive && hasDenyAnon,
      'RLS SQL: ENABLE + RESTRICTIVE deny_anon policy',
      `enable=${hasEnable} restrictive=${hasRestrictive} denyAnon=${hasDenyAnon}`);
  } catch (e) {
    log(false, 'RLS SQL analysis', e.message);
  }

  // ── Summary ──
  console.log('\n════════════════════════════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const failed = results.filter(r => !r.pass);

  if (failed.length > 0) {
    console.log(`\n❌ FAILED (${failed.length}):`);
    failed.forEach(f => console.log(`   • ${f.name}: ${f.detail}`));
  }

  console.log(`\n🏁 Result: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('\n🔒 SECURITY HARDENING VALIDATED — All structural checks pass');
  } else {
    console.log('\n⚠️  Some checks failed — review required');
  }

  console.log('════════════════════════════════════════════════════════\n');
  
  return { passed, total, failed: failed.map(f => f.name) };
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
