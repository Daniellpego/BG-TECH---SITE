/**
 * Seed Script — Painel CFO Dashboard
 * 
 * Populates the Supabase database with realistic test data
 * for stress testing and E2E testing scenarios.
 * 
 * Usage:
 *   node seed/populate.mjs              # Default: 50 entries per array
 *   ENTRIES=500 node seed/populate.mjs   # Heavy dataset
 *   node seed/populate.mjs --reset       # Clear all data first
 * 
 * ⚠️  This modifies the production row (id=1). Use with caution.
 */

const SUPABASE_URL = 'https://urpuiznydrlwmaqhdids.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycHVpem55ZHJsd21hcWhkaWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjQ0OTIsImV4cCI6MjA4NzIwMDQ5Mn0.qSoyYmBTvgdOAickkuLCYCveOj2ELIZt85LFZb6veQ8';

const ENTRIES = parseInt(process.env.ENTRIES || '50');
const RESET = process.argv.includes('--reset');

const CATS_FIXOS = ['Contabilidade', 'Ferramentas (Google, Software, etc.)', 'Hospedagem / Infraestrutura', 'Pró-labore', 'Taxas Bancárias Fixas', 'Outros Custos Fixos'];
const CATS_UNICOS = ['Marketing (Tráfego, Campanhas)', 'Taxas de Meios de Pagamento', 'Freelancers por Projeto', 'Serviços Terceirizados Pontuais', 'APIs e Consumo Variável', 'Impostos sobre Faturamento', 'Gasto Não Previsto'];
const CATS_ENTRADAS = ['Receita de Setup (Pontual)', 'Receita de Mensalidades (Recorrente)', 'Projetos Avulsos / Serviços Pontuais', 'Outras Receitas'];

const CLIENTS = ['Acme Corp', 'TechStart', 'Loja Bella', 'Fitness Pro', 'MedConsult', 'EduTech', 'GreenEnergy', 'FastLogistics'];
const PROJECTS = ['Site Institucional', 'App Mobile', 'E-commerce', 'Dashboard BI', 'API Gateway', 'CRM Custom', 'Landing Page', 'Chatbot AI'];
const NOMES_FIXOS = ['Aluguel Coworking', 'Google Workspace', 'AWS Hosting', 'Pró-labore Daniel', 'Pró-labore Gustavo', 'Contabilidade Mensal', 'Domínios e SSL', 'Slack Premium'];
const NOMES_UNICOS = ['Campanha Google Ads', 'Freela UI/UX Designer', 'Compra de API OpenAI', 'Material de Marketing', 'Taxa Stripe', 'Consultoria Jurídica', 'Licença Adobe'];
const NOMES_ENTRADAS = ['Setup Inicial', 'Mensalidade Manutenção', 'Projeto Avulso Dev', 'Consultoria Técnica', 'Mensalidade SaaS', 'Treinamento Equipe', 'Suporte Premium'];

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomDate(year = 2025) {
  const m = rand(1, 12);
  const d = rand(1, 28);
  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function generateEntries(n, type) {
  const entries = [];
  for (let i = 0; i < n; i++) {
    const year = Math.random() < 0.7 ? 2025 : 2026;
    const base = {
      id: genId(type.substring(0, 3)),
      data: randomDate(year),
      status: Math.random() < 0.75 ? 'Confirmado' : 'Previsto',
      recorrente: Math.random() < 0.4 ? 'mensal' : 'unico',
      cliente: pick(CLIENTS),
      projeto: pick(PROJECTS),
      descricao: '',
    };

    switch (type) {
      case 'fixos':
        entries.push({ ...base, nome: pick(NOMES_FIXOS), valor: rand(100, 3000), categoria: pick(CATS_FIXOS) });
        break;
      case 'unicos':
        entries.push({ ...base, nome: pick(NOMES_UNICOS), valor: rand(50, 5000), categoria: pick(CATS_UNICOS) });
        break;
      case 'entradas':
        entries.push({ ...base, nome: pick(NOMES_ENTRADAS), valor: rand(500, 15000), categoria: pick(CATS_ENTRADAS) });
        break;
    }
  }
  return entries;
}

function generateProjections(n) {
  const entradas = [], saidas = [];
  const now = new Date();
  
  for (let i = 0; i < n; i++) {
    const futureMonth = new Date(now.getFullYear(), now.getMonth() + rand(1, 12), 1);
    const mes = `${futureMonth.getFullYear()}-${String(futureMonth.getMonth() + 1).padStart(2, '0')}`;
    
    if (Math.random() < 0.5) {
      entradas.push({
        id: genId('proj'),
        nome: `Proj: ${pick(NOMES_ENTRADAS)} - ${pick(CLIENTS)}`,
        valor: rand(2000, 20000),
        mes,
        categoria: pick(CATS_ENTRADAS),
        status: Math.random() < 0.3 ? 'Confirmado' : 'Previsto',
      });
    } else {
      saidas.push({
        id: genId('proj'),
        nome: `Proj: ${pick(NOMES_UNICOS)}`,
        valor: rand(200, 5000),
        mes,
        categoria: pick([...CATS_FIXOS, ...CATS_UNICOS]),
        status: 'Previsto',
      });
    }
  }
  return { entradas, saidas };
}

async function main() {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       SEED — Painel CFO Test Data           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Entries per array: ${ENTRIES}`);
  console.log(`║  Reset mode:       ${RESET}`);
  console.log('╚══════════════════════════════════════════════╝\n');

  if (RESET) {
    console.log('🗑️  Resetting all data...');
  }

  const fixos = RESET ? [] : [];
  const unicos = RESET ? [] : [];
  const entradas = RESET ? [] : [];

  console.log(`📦 Generating ${ENTRIES} fixos...`);
  fixos.push(...generateEntries(ENTRIES, 'fixos'));

  console.log(`📦 Generating ${ENTRIES} unicos...`);
  unicos.push(...generateEntries(ENTRIES, 'unicos'));

  console.log(`📦 Generating ${ENTRIES} entradas...`);
  entradas.push(...generateEntries(ENTRIES, 'entradas'));

  console.log(`📦 Generating ${Math.floor(ENTRIES / 2)} projections...`);
  const projecoes = generateProjections(Math.floor(ENTRIES / 2));

  const caixa = rand(10000, 150000);
  console.log(`💰 Caixa disponível: R$ ${caixa.toLocaleString('pt-BR')}\n`);

  const payload = {
    id: 1,
    fixos,
    unicos,
    entradas,
    projecoes,
    caixa_disponivel: caixa,
    updated_at: new Date().toISOString(),
  };

  console.log('📤 Uploading to Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/painel_gastos?on_conflict=id`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const totalItems = fixos.length + unicos.length + entradas.length + projecoes.entradas.length + projecoes.saidas.length;
    console.log(`✅ Seed complete! ${totalItems} total items uploaded.`);
    console.log(`   fixos:     ${fixos.length}`);
    console.log(`   unicos:    ${unicos.length}`);
    console.log(`   entradas:  ${entradas.length}`);
    console.log(`   projeções: ${projecoes.entradas.length} entradas + ${projecoes.saidas.length} saídas`);
    console.log(`   caixa:     R$ ${caixa.toLocaleString('pt-BR')}`);
  } else {
    console.error(`❌ Failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
