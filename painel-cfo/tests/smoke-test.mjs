// Quick smoke test — run with: node smoke-test.mjs
const BASE = 'http://localhost:5500';

async function test() {
  const results = [];

  // TEST 1: Read
  console.log('=== TESTE 1: LEITURA ===');
  const r1 = await fetch(`${BASE}/api/painel`);
  const data = await r1.json();
  console.log('Status:', r1.status);
  console.log('Fixos:', data.fixos?.length, 'itens');
  console.log('Unicos:', data.unicos?.length, 'itens');
  console.log('Entradas:', data.entradas?.length, 'itens');
  console.log('Caixa:', data.caixa_disponivel);
  console.log('updated_at:', data.updated_at);
  const t1 = r1.status === 200;
  console.log('RESULTADO:', t1 ? '✅ OK' : '❌ FALHOU');
  results.push(t1);

  // TEST 2: Write (CAS)
  console.log('\n=== TESTE 2: ESCRITA (CAS) ===');
  const r2 = await fetch(`${BASE}/api/painel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fixos: data.fixos || [],
      unicos: data.unicos || [],
      entradas: data.entradas || [],
      projecoes: data.projecoes || { entradas: [], saidas: [] },
      caixa_disponivel: data.caixa_disponivel || 0,
      updated_at: new Date().toISOString(),
      expected_updated_at: data.updated_at,
    }),
  });
  const w = await r2.json();
  console.log('Status:', r2.status);
  console.log('Success:', w.success, '| CAS:', w.cas);
  console.log('new updated_at:', w.updated_at);
  const t2 = r2.status === 200 && w.success;
  console.log('RESULTADO:', t2 ? '✅ OK' : '❌ FALHOU');
  results.push(t2);

  // TEST 3: Re-read after write
  console.log('\n=== TESTE 3: RELEITURA ===');
  const r3 = await fetch(`${BASE}/api/painel`);
  const d3 = await r3.json();
  const tsChanged = d3.updated_at !== data.updated_at;
  const dataIntact = d3.fixos?.length === data.fixos?.length;
  console.log('updated_at mudou?', tsChanged ? 'SIM ✅' : 'NAO ❌');
  console.log('Dados intactos?', dataIntact ? 'SIM ✅' : 'NAO ❌');
  const t3 = r3.status === 200 && tsChanged && dataIntact;
  console.log('RESULTADO:', t3 ? '✅ OK' : '❌ FALHOU');
  results.push(t3);

  // TEST 4: Validation rejects bad body
  console.log('\n=== TESTE 4: VALIDACAO ===');
  const r4 = await fetch(`${BASE}/api/painel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixos: 'invalido' }),
  });
  console.log('Status:', r4.status, r4.status === 400 ? '✅ Rejeitou' : '❌ Aceitou');
  const t4 = r4.status === 400;
  results.push(t4);

  // TEST 5: Method restriction
  console.log('\n=== TESTE 5: DELETE BLOQUEADO ===');
  const r5 = await fetch(`${BASE}/api/painel`, { method: 'DELETE' });
  console.log('Status:', r5.status, r5.status === 405 ? '✅ Bloqueou' : '❌ Permitiu');
  const t5 = r5.status === 405;
  results.push(t5);

  // Summary
  const passed = results.filter(Boolean).length;
  console.log('\n═══════════════════════════════');
  console.log(`  ${passed}/${results.length} testes passaram`);
  console.log(passed === results.length
    ? '  ✅ TUDO FUNCIONANDO — PODE USAR'
    : '  ❌ ALGUM TESTE FALHOU');
  console.log('═══════════════════════════════\n');
}

test().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
