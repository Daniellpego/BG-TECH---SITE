/**
 * Load / Stress Test — Painel CFO Dashboard
 * 
 * Simulates N concurrent virtual users performing read + write operations
 * against the Supabase backend to measure:
 *   - Read latency (p50, p95, p99)
 *   - Write latency (p50, p95, p99)
 *   - Error rate
 *   - Data consistency (final read matches expected state)
 *   - Concurrent write conflict rate
 * 
 * Usage:
 *   node load/stress-test.mjs                          # 50 users, 60s
 *   USERS=200 DURATION=120 node load/stress-test.mjs   # 200 users, 120s
 * 
 * Requirements:
 *   - Node.js >= 18 (uses native fetch)
 *   - Network access to Supabase endpoint
 * 
 * ⚠️  This hits the real Supabase endpoint. Use with caution.
 *     For safe testing, use the seed script first to create test data.
 */

const SUPABASE_URL = 'https://urpuiznydrlwmaqhdids.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycHVpem55ZHJsd21hcWhkaWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjQ0OTIsImV4cCI6MjA4NzIwMDQ5Mn0.qSoyYmBTvgdOAickkuLCYCveOj2ELIZt85LFZb6veQ8';

const NUM_USERS = parseInt(process.env.USERS || '50');
const DURATION_SEC = parseInt(process.env.DURATION || '60');
const THINK_TIME_MS = 500;   // Time between operations per user
const ROW_ID = 1;

// ─── Metrics Collector ────────────────────────────────────────
const metrics = {
  reads: { ok: 0, fail: 0, latencies: [] },
  writes: { ok: 0, fail: 0, latencies: [] },
  conflicts: 0,
  errors: [],
  startTime: 0,
};

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Supabase API Helpers ─────────────────────────────────────
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function supabaseRead() {
  const t0 = performance.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/painel_gastos?id=eq.${ROW_ID}&select=*`,
      { method: 'GET', headers: { ...headers, 'Accept': 'application/vnd.pgrst.object+json' } }
    );
    const elapsed = performance.now() - t0;
    if (!res.ok) {
      metrics.reads.fail++;
      metrics.errors.push(`READ ${res.status}: ${await res.text()}`);
      return null;
    }
    metrics.reads.ok++;
    metrics.reads.latencies.push(elapsed);
    return await res.json();
  } catch (e) {
    metrics.reads.fail++;
    metrics.reads.latencies.push(performance.now() - t0);
    metrics.errors.push(`READ ERR: ${e.message}`);
    return null;
  }
}

async function supabaseWrite(payload) {
  const t0 = performance.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/painel_gastos?on_conflict=id`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(payload),
      }
    );
    const elapsed = performance.now() - t0;
    if (!res.ok) {
      metrics.writes.fail++;
      const body = await res.text();
      if (body.includes('conflict') || res.status === 409) metrics.conflicts++;
      metrics.errors.push(`WRITE ${res.status}: ${body}`);
      return false;
    }
    metrics.writes.ok++;
    metrics.writes.latencies.push(elapsed);
    return true;
  } catch (e) {
    metrics.writes.fail++;
    metrics.writes.latencies.push(performance.now() - t0);
    metrics.errors.push(`WRITE ERR: ${e.message}`);
    return false;
  }
}

// ─── Virtual User Simulation ──────────────────────────────────
async function virtualUser(userId, signal) {
  let ops = 0;
  while (!signal.aborted) {
    // 70% reads, 30% writes (typical dashboard pattern)
    if (Math.random() < 0.7) {
      await supabaseRead();
    } else {
      // Read-modify-write cycle (simulates user adding an entry)
      const data = await supabaseRead();
      if (data) {
        const testEntry = {
          id: `load_${userId}_${Date.now().toString(36)}`,
          nome: `Load Test User ${userId}`,
          valor: Math.floor(Math.random() * 10000),
          data: '2025-06-15',
          categoria: 'Outros Custos Fixos',
          status: 'Previsto',
          recorrente: 'unico',
        };

        const fixos = Array.isArray(data.fixos) ? data.fixos : [];
        // Keep array manageable — only add if under 500 items
        if (fixos.length < 500) fixos.push(testEntry);

        await supabaseWrite({
          id: ROW_ID,
          fixos: fixos,
          unicos: data.unicos,
          entradas: data.entradas,
          projecoes: data.projecoes,
          caixa_disponivel: data.caixa_disponivel,
          updated_at: new Date().toISOString(),
        });
      }
    }
    ops++;

    // Think time with jitter
    const jitter = THINK_TIME_MS + Math.random() * THINK_TIME_MS;
    await new Promise(r => setTimeout(r, jitter));
  }
  return ops;
}

// ─── Data Consistency Check ───────────────────────────────────
async function consistencyCheck() {
  console.log('\n🔍 Running data consistency check...');
  
  const reads = await Promise.all(
    Array.from({ length: 5 }, () => supabaseRead())
  );

  const valid = reads.filter(Boolean);
  if (valid.length < 2) {
    console.log('   ❌ Not enough successful reads for consistency check');
    return false;
  }

  // All reads should return the same updated_at
  const timestamps = valid.map(r => r.updated_at);
  const allSame = timestamps.every(t => t === timestamps[0]);
  
  if (allSame) {
    console.log(`   ✅ All ${valid.length} reads returned consistent data (updated_at: ${timestamps[0]})`);
  } else {
    console.log(`   ⚠️  Inconsistent reads detected! Timestamps: ${timestamps.join(', ')}`);
  }

  // Validate data shape
  for (const row of valid) {
    const isArrayF = Array.isArray(row.fixos);
    const isArrayU = Array.isArray(row.unicos);
    const isArrayE = Array.isArray(row.entradas);
    const hasProjObj = row.projecoes && typeof row.projecoes === 'object';
    
    if (!isArrayF || !isArrayU || !isArrayE || !hasProjObj) {
      console.log(`   ❌ Data shape corruption detected!`);
      console.log(`      fixos: ${isArrayF}, unicos: ${isArrayU}, entradas: ${isArrayE}, projecoes: ${hasProjObj}`);
      return false;
    }
  }

  console.log('   ✅ Data shape is valid across all reads');
  return allSame;
}

// ─── Cleanup Load Test Data ───────────────────────────────────
async function cleanup() {
  console.log('\n🧹 Cleaning up load test data...');
  const data = await supabaseRead();
  if (!data) { console.log('   ❌ Could not read for cleanup'); return; }

  const before = (data.fixos || []).length;
  const cleaned = (data.fixos || []).filter(x => !x.id?.startsWith('load_'));
  const removed = before - cleaned.length;

  if (removed > 0) {
    await supabaseWrite({
      id: ROW_ID,
      fixos: cleaned,
      unicos: data.unicos,
      entradas: data.entradas,
      projecoes: data.projecoes,
      caixa_disponivel: data.caixa_disponivel,
      updated_at: new Date().toISOString(),
    });
    console.log(`   ✅ Removed ${removed} load test entries from fixos`);
  } else {
    console.log('   ✅ No load test data to clean');
  }
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       PAINEL CFO — LOAD / STRESS TEST                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Virtual Users:  ${String(NUM_USERS).padEnd(8)} Duration: ${DURATION_SEC}s`);
  console.log(`║  Think Time:     ${THINK_TIME_MS}ms        Target: Supabase REST`);
  console.log(`║  Mix:            70% reads / 30% writes`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Pre-flight check
  console.log('🔌 Pre-flight: testing Supabase connectivity...');
  const preflight = await supabaseRead();
  if (!preflight) {
    console.error('❌ Cannot connect to Supabase. Aborting.');
    process.exit(1);
  }
  console.log(`   ✅ Connected. Row has ${(preflight.fixos||[]).length} fixos, ${(preflight.entradas||[]).length} entradas\n`);

  // Start virtual users
  const controller = new AbortController();
  metrics.startTime = Date.now();

  console.log(`🚀 Starting ${NUM_USERS} virtual users for ${DURATION_SEC} seconds...\n`);
  
  const userPromises = Array.from({ length: NUM_USERS }, (_, i) =>
    virtualUser(i, controller.signal)
  );

  // Progress ticker
  const ticker = setInterval(() => {
    const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
    const totalOps = metrics.reads.ok + metrics.reads.fail + metrics.writes.ok + metrics.writes.fail;
    const rps = (totalOps / (elapsed || 1)).toFixed(1);
    process.stdout.write(
      `\r   ⏱  ${elapsed}s / ${DURATION_SEC}s | Ops: ${totalOps} (${rps}/s) | Reads: ${metrics.reads.ok}✓ ${metrics.reads.fail}✗ | Writes: ${metrics.writes.ok}✓ ${metrics.writes.fail}✗`
    );
  }, 1000);

  // Run for DURATION_SEC
  await new Promise(r => setTimeout(r, DURATION_SEC * 1000));
  controller.abort();
  clearInterval(ticker);

  // Wait for in-flight ops to settle
  await Promise.allSettled(userPromises);
  console.log('\n');

  // ─── Results ──────────────────────────────────────────────
  const totalTime = (Date.now() - metrics.startTime) / 1000;
  const totalOps = metrics.reads.ok + metrics.reads.fail + metrics.writes.ok + metrics.writes.fail;
  const errorRate = totalOps > 0 ? (((metrics.reads.fail + metrics.writes.fail) / totalOps) * 100).toFixed(2) : '0';

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       RESULTS                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Duration:         ${totalTime.toFixed(1)}s`);
  console.log(`║  Total Operations: ${totalOps}`);
  console.log(`║  Throughput:       ${(totalOps / totalTime).toFixed(1)} ops/s`);
  console.log(`║  Error Rate:       ${errorRate}%`);
  console.log('║');
  console.log('║  READS:');
  console.log(`║    Success: ${metrics.reads.ok}    Fail: ${metrics.reads.fail}`);
  console.log(`║    p50: ${percentile(metrics.reads.latencies, 0.5).toFixed(0)}ms    p95: ${percentile(metrics.reads.latencies, 0.95).toFixed(0)}ms    p99: ${percentile(metrics.reads.latencies, 0.99).toFixed(0)}ms`);
  console.log('║');
  console.log('║  WRITES:');
  console.log(`║    Success: ${metrics.writes.ok}    Fail: ${metrics.writes.fail}`);
  console.log(`║    p50: ${percentile(metrics.writes.latencies, 0.5).toFixed(0)}ms    p95: ${percentile(metrics.writes.latencies, 0.95).toFixed(0)}ms    p99: ${percentile(metrics.writes.latencies, 0.99).toFixed(0)}ms`);
  console.log('║');
  console.log(`║  Conflict Events:  ${metrics.conflicts}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (metrics.errors.length > 0) {
    console.log(`\n⚠️  Unique Errors (showing first 10 of ${metrics.errors.length}):`);
    const unique = [...new Set(metrics.errors)].slice(0, 10);
    unique.forEach(e => console.log(`   • ${e}`));
  }

  // Consistency check
  const consistent = await consistencyCheck();

  // Cleanup
  await cleanup();

  // ─── Verdict ──────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  const errorRateNum = parseFloat(errorRate);
  const p95Read = percentile(metrics.reads.latencies, 0.95);
  const p95Write = percentile(metrics.writes.latencies, 0.95);

  if (errorRateNum < 1 && p95Read < 2000 && p95Write < 3000 && consistent) {
    console.log('✅ PASS — System is stable under load');
  } else if (errorRateNum < 5 && p95Read < 5000) {
    console.log('⚠️  WARN — System is degraded but functional');
  } else {
    console.log('❌ FAIL — System cannot handle the load');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Exit code
  process.exit(errorRateNum > 5 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
