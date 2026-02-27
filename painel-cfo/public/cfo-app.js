const DB = {
    url: "https://urpuiznydrlwmaqhdids.supabase.co/rest/v1/painel_gastos?id=eq.1",
    key: "sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0"
};
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CATS = {
    entradas: [
        "Receita de Setup (Pontual)",
        "Receita de Mensalidades (Recorrente)",
        "Projetos Avulsos / Serviços Pontuais",
        "Outras Receitas"
    ],
    fixos: [
        "Contabilidade",
        "Ferramentas (Google, Software, etc.)",
        "Hospedagem / Infraestrutura",
        "Pró-labore",
        "Taxas Bancárias Fixas",
        "Outros Custos Fixos"
    ],
    unicos: [
        "Marketing (Tráfego, Campanhas)",
        "Taxas de Meios de Pagamento",
        "Freelancers por Projeto",
        "Serviços Terceirizados Pontuais",
        "APIs e Consumo Variável",
        "Impostos sobre Faturamento",
        "Gasto Não Previsto"
    ]
};
const RECOR_HINTS = {
    unico: "Lançamento pontual, somente neste mês.",
    mensal: "Replica automaticamente para todos os 12 meses do ano selecionado.",
    proximo: "Replica a partir do mês da data informada até dezembro do mesmo ano."
};

const LANGS = {
    'pt-BR': {
        dashboard: "Painel Geral",
        dre: "DRE Gerencial",
        annual: "Balanço Anual",
        revenue: "Receitas",
        fixed: "Custos Fixos",
        variable: "Gastos Variáveis",
        export: "Exportar",
        projections: "Projeções",
        caixa: "Caixa Disponível",
        runway: "Runway (Sobrevivência)",
        resLiq: "Resultado Líquido",
        burn: "Burn Rate Mensal"
    },
    'en-US': {
        dashboard: "General Panel",
        dre: "Management P&L",
        annual: "Annual Balance",
        revenue: "Revenue",
        fixed: "Fixed Costs",
        variable: "Variable Expenses",
        export: "Export",
        projections: "Projections",
        caixa: "Cash Balance",
        runway: "Runway",
        resLiq: "Net Income",
        burn: "Monthly Burn Rate"
    }
};

// Global escape function
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const A = {
    state: { tab: 'overview', type: 'fixos', modo: 'despesa', pTipo: 'saida', lang: 'pt-BR', data: { fixos: [], unicos: [], entradas: [], projecoes: { entradas: [], saidas: [] }, caixa_disponivel: 0 }, supportsEntradas: true },
    ch: { area: null, donut: null, dreBar: null, dreLine: null },

    genId(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9); },

    supabaseChannel: null,
    init() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        const sel = document.getElementById('fMonth');
        if (sel && sel.options.length <= 1) {
            MONTHS.forEach((m, i) => sel.innerHTML += `<option value="${i}">${m}</option>`);
            sel.value = new Date().getMonth();
        }
        const lp = document.getElementById('lp');
        if (lp) lp.addEventListener('keypress', e => { if (e.key === 'Enter') A.login() });
        const lu = document.getElementById('lu');
        if (lu) lu.addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('lp').focus() });
        const fd = document.getElementById('f-data');
        if (fd) fd.value = new Date().toISOString().split('T')[0];
        // Filtros Cliente e Projeto
        if (!document.getElementById('fCliente')) {
            const fGroup = document.getElementById('main-filters');
            if (fGroup) {
                const clienteSel = document.createElement('input');
                clienteSel.id = 'fCliente';
                clienteSel.className = 'filter-input';
                clienteSel.placeholder = 'Cliente (opcional)';
                clienteSel.oninput = () => A.render();
                fGroup.appendChild(clienteSel);
                const projetoSel = document.createElement('input');
                projetoSel.id = 'fProjeto';
                projetoSel.className = 'filter-input';
                projetoSel.placeholder = 'Projeto (opcional)';
                projetoSel.oninput = () => A.render();
                fGroup.appendChild(projetoSel);
            }
        }
    },
    cleanup() {
        if (A.supabaseChannel && typeof A.supabaseChannel.unsubscribe === 'function') {
            A.supabaseChannel.unsubscribe();
            A.supabaseChannel = null;
        }
    },
                A.fetchSync();
                // Supabase Realtime
                if (window.supabase) {
                    const supabase = window.supabase;
                    A.cleanup();
                    A.supabaseChannel = supabase.channel('painel_gastos')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'painel_gastos' }, payload => {
                            A.fetchSync();
                        })
                        .subscribe();
                } else {
                    setInterval(() => A.fetchSync(true), 15000);
                }
            }, 500);
        } else {
            A.toast("Credenciais inválidas.", "err"); lc.classList.remove('shake'); void lc.offsetWidth; lc.classList.add('shake');
            document.getElementById('lp').value = ''; document.getElementById('lp').focus();
        }
    },

    tab(t) {
        A.state.tab = t;
        document.querySelectorAll('[data-tab]').forEach(b => {
            const a = b.getAttribute('data-tab') === t;
            if (a) b.classList.add('active'); else b.classList.remove('active');
        });
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const viewMap = { 'overview': 'view-overview', 'dre': 'view-dre', 'annual': 'view-annual', 'entradas': 'view-entradas', 'relatorios': 'view-relatorios', 'projecoes': 'view-projecoes', 'fixos': 'view-list', 'unicos': 'view-list' };
        const targetView = document.getElementById(viewMap[t]);
        if (targetView) targetView.classList.add('active');

        const titles = {
            overview: ['Painel Geral', 'Visão executiva para decisão rápida'],
            dre: ['DRE Gerencial', 'Inteligência Financeira (Não Fiscal)'],
            annual: ['Balanço Anual', 'Projeção e realizado por mês'],
            fixos: ['Custos Fixos', 'Despesas necessárias para a empresa existir'],
            unicos: ['Gastos Variáveis', 'Custos atrelados a vendas e impostos'],
            entradas: ['Receitas', 'Entradas de capital (Setup, Recorrente, Avulso)'],
            relatorios: ['Exportar', 'Relatórios oficiais da operação'],
            projecoes: ['Projeções Futuras', 'Simulador de cenários de DRE e Caixa']
        };
        document.getElementById('page-title').textContent = titles[t][0];
        document.getElementById('page-sub').innerHTML = `<i data-lucide="activity" width="16" height="16"></i> ${titles[t][1]}`;

        const addBtn = document.getElementById('btn-add-main');
        const hGroup = document.getElementById('main-filters');
        if (t === 'projecoes') {
            if (hGroup) hGroup.style.display = 'none';
            if (addBtn) { addBtn.style.display = ''; addBtn.onclick = () => A.openProjDrawer('saida'); document.getElementById('btn-add-label').textContent = 'Nova Projeção'; }
            A.renderProjecoes();
        } else if (t === 'relatorios') {
            if (hGroup) hGroup.style.display = 'flex'; if (addBtn) addBtn.style.display = 'none'; A.render();
        } else {
            if (hGroup) hGroup.style.display = 'flex';
            if (addBtn) {
                addBtn.style.display = '';
                if (t === 'entradas') { document.getElementById('btn-add-label').textContent = 'Nova Receita'; addBtn.className = 'btn-success'; addBtn.onclick = () => A.openDrawer(null, 'entrada'); }
                else { document.getElementById('btn-add-label').textContent = 'Novo Lançamento'; addBtn.className = 'btn-primary'; addBtn.onclick = () => A.openDrawer(); }
            }
            A.render();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async fetchSync(silent = false) {
        if (!silent) A.syncUI('load');
        try {
            const r = await fetch(DB.url, { headers: { apikey: DB.key, Authorization: `Bearer ${DB.key}`, 'Cache-Control': 'no-cache' } });
            if (!r.ok) throw new Error("HTTP error");
            const d = await r.json();
            if (d && d[0]) {
                A.state.data.fixos = Array.isArray(d[0].fixos) ? d[0].fixos : JSON.parse(d[0].fixos || '[]');
                A.state.data.unicos = Array.isArray(d[0].unicos) ? d[0].unicos : JSON.parse(d[0].unicos || '[]');
                A.state.data.entradas = Array.isArray(d[0].entradas) ? d[0].entradas : JSON.parse(d[0].entradas || '[]');
                A.state.data.projecoes = typeof d[0].projecoes === 'string' ? JSON.parse(d[0].projecoes) : (d[0].projecoes || { entradas: [], saidas: [] });
                A.state.data.caixa_disponivel = d[0].caixa_disponivel || 0;
            }
            A.syncUI('ok'); A.render();
        } catch (e) {
            A.syncUI('err');
            A.toast("Erro ao sincronizar dados: " + (e.message || e), "err");
        }
    },

    async pushSync() {
        A.syncUI('load');
        try {
            const payload = {
                fixos: A.state.data.fixos || [],
                unicos: A.state.data.unicos || [],
                entradas: A.state.data.entradas || [],
                projecoes: A.state.data.projecoes || { entradas: [], saidas: [] },
                caixa_disponivel: A.state.data.caixa_disponivel || 0,
                updated_at: new Date().toISOString()
            };
            const r = await fetch(DB.url, { method: 'PATCH', headers: { apikey: DB.key, Authorization: `Bearer ${DB.key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
            if (!r.ok) throw new Error("Falha ao salvar");
            A.syncUI('ok');
        } catch (e) {
            A.syncUI('err');
            A.toast("Erro ao salvar: " + (e.message || e), "warning");
        }
    },

    syncUI(s) { const dot = document.getElementById('sync-dot'), txt = document.getElementById('sync-txt'), m = { load: ['var(--warning)', 'Sincronizando...'], ok: ['var(--success)', 'Nuvem Conectada'], err: ['var(--danger)', 'Modo Offline'] }; if (dot) { dot.style.background = m[s][0]; dot.style.boxShadow = `0 0 12px ${m[s][0]}`; } if (txt) txt.textContent = m[s][1]; },
    maskMoney(e) { let v = e.target.value.replace(/\D/g, ''); if (!v) { e.target.value = ''; return; } v = (parseInt(v) / 100).toFixed(2); e.target.value = v.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); },
    cleanMoney(s) { return parseFloat((s || '0').replace(/\./g, '').replace(',', '.')) || 0; },
    fmtR(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); },
    fmtD(d) { if (!d) return '--'; const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d; },

    filterData(arr, mStr, yStr, isYTD = false) {
        return (arr || []).filter(x => {
            if (!x.data) return false;
            const [y, m] = x.data.split('-');
            if (y !== yStr) return false;
            if (mStr === 'anual') return true;
            if (isYTD) return parseInt(m) <= (parseInt(mStr) + 1);
            return parseInt(m) === (parseInt(mStr) + 1);
        });
    },

    async editCaixa() {
        const atual = A.state.data.caixa_disponivel || 0;
        const input = prompt("Saldo disponível (R$):", parseFloat(atual).toFixed(2));
        if (input !== null) { A.state.data.caixa_disponivel = A.cleanMoney(input); A.render(); await A.pushSync(); }
    },

    trendHTML(curr, prev, invertColors = false) {
        if (!prev || prev === 0) return `<span class="trend-badge neutral">Sem histórico</span>`;
        const pct = ((curr - prev) / prev) * 100;
        let isGood = pct >= 0; if (invertColors) isGood = !isGood;
        return `<span class="trend-badge ${isGood ? 'up' : 'down'}"><i data-lucide="${pct >= 0 ? 'trending-up' : 'trending-down'}" width="12" height="12"></i> ${Math.abs(pct).toFixed(1)}%</span>`;
    },

    render() {
        if (A.state.tab === 'projecoes') { A.renderProjecoes(); return; }
        const mVal = document.getElementById('fMonth').value, yVal = document.getElementById('fYear').value, t = A.state.tab;
        const clienteVal = document.getElementById('fCliente') ? document.getElementById('fCliente').value : '';
        const projetoVal = document.getElementById('fProjeto') ? document.getElementById('fProjeto').value : '';
        // Filtros avançados
        const filterBy = (arr) => arr.filter(x =>
            (!clienteVal || (x.cliente && x.cliente.toLowerCase().includes(clienteVal.toLowerCase()))) &&
            (!projetoVal || (x.projeto && x.projeto.toLowerCase().includes(projetoVal.toLowerCase())))
        );
        const eM = filterBy(A.filterData(A.state.data.entradas, mVal, yVal));
        const fM = filterBy(A.filterData(A.state.data.fixos, mVal, yVal));
        const uM = filterBy(A.filterData(A.state.data.unicos, mVal, yVal));
        // MRR: Apenas entradas confirmadas e recorrentes mensais
        const mrrList = eM.filter(x => x.status === 'Confirmado' && x.recorrente === 'mensal');
        const sumMRR = mrrList.reduce((a, b) => a + Number(b.valor), 0);
        const sumE = eM.reduce((a, b) => a + Number(b.valor), 0);
        const sumF = fM.reduce((a, b) => a + Number(b.valor), 0);
        const sumU = uM.reduce((a, b) => a + Number(b.valor), 0);
        const sumBurn = sumF + sumU;
        // Margem Líquida: (Receita - Custos Totais) / Receita
        const resLiq = sumE - sumBurn;
        const margem = sumE > 0 ? ((resLiq / sumE) * 100).toFixed(1) : '0.0';
        // LTV: MRR * tempo médio de retenção (em meses)
        // Supondo tempo médio de retenção de 12 meses (ajuste conforme necessário)
        const tempoRetencao = 12;
        const ltv = sumMRR * tempoRetencao;
        const runway = sumBurn > 0 ? (A.state.data.caixa_disponivel / sumBurn).toFixed(1) : '99+';

        if (t === 'overview') {
            // Comparação com período anterior
            const prevMonth = (parseInt(mVal) - 1 + 12) % 12;
            const prevYear = prevMonth === 11 ? (parseInt(yVal) - 1).toString() : yVal;
            const prevE = A.filterData(A.state.data.entradas, prevMonth.toString(), prevYear).reduce((a, b) => a + Number(b.valor), 0);
            const prevF = A.filterData(A.state.data.fixos, prevMonth.toString(), prevYear).reduce((a, b) => a + Number(b.valor), 0);
            const prevU = A.filterData(A.state.data.unicos, prevMonth.toString(), prevYear).reduce((a, b) => a + Number(b.valor), 0);
            const prevBurn = prevF + prevU;
            const prevMRR = A.filterData(A.state.data.entradas, prevMonth.toString(), prevYear).filter(x => x.status === 'Confirmado' && x.recorrente === 'mensal').reduce((a, b) => a + Number(b.valor), 0);
            const prevResLiq = prevE - prevBurn;
            // Cards
            A.animateValue('v-caixa', A.state.data.caixa_disponivel);
            document.getElementById('v-runway').textContent = `${runway} Meses`;
            A.animateValue('v-receita-ov', sumE);
            A.animateValue('v-burn-ov', sumBurn);
            A.animateValue('v-fixos-ov', sumF);
            A.animateValue('v-var-ov', sumU);
            const elMRR = document.getElementById('v-mrr');
            if (elMRR) elMRR.textContent = A.fmtR(sumMRR);
            const elLTV = document.getElementById('v-ltv');
            if (elLTV) elLTV.textContent = A.fmtR(ltv);
            // Resultado Líquido do Período
            const elRes = document.getElementById('v-res-liq'), subRes = document.getElementById('v-res-liq-sub');
            if (elRes) { elRes.textContent = (resLiq >= 0 ? '+ ' : '- ') + A.fmtR(Math.abs(resLiq)); elRes.style.color = resLiq >= 0 ? 'var(--success)' : 'var(--danger)'; }
            if (subRes) subRes.innerHTML = `<span class="trend-badge ${resLiq >= 0 ? 'up' : 'down'}">${resLiq >= 0 ? 'Resultado Líquido' : 'Prejuízo'}: ${margem}%</span>`;
            // Tendências
            const trend = (curr, prev) => {
                if (prev === 0) return '<span class="trend-badge neutral">Sem histórico</span>';
                const pct = ((curr - prev) / Math.abs(prev)) * 100;
                return `<span class="trend-badge ${pct >= 0 ? 'up' : 'down'}"><i data-lucide="${pct >= 0 ? 'trending-up' : 'trending-down'}" width="12" height="12"></i> ${Math.abs(pct).toFixed(1)}%</span>`;
            };
            document.getElementById('trend-receita').innerHTML = trend(sumE, prevE);
            document.getElementById('trend-burn').innerHTML = trend(sumBurn, prevBurn);
            document.getElementById('trend-mrr').innerHTML = trend(sumMRR, prevMRR);
            document.getElementById('trend-resliq').innerHTML = trend(resLiq, prevResLiq);
            // Status automático da operação
            const statusEl = document.getElementById('status-operacao');
            let status = 'Verde';
            if (runway < 1 || sumBurn > sumE || A.state.data.caixa_disponivel < 0) status = 'Vermelho';
            else if (runway < 3 || resLiq < 0) status = 'Amarelo';
            if (statusEl) {
                statusEl.textContent = `Operação: ${status}`;
                statusEl.className = `status-dot ${status.toLowerCase()}`;
            }
        }
        }
        if (t === 'dre') A.renderDRE(mVal, yVal);
        if (t === 'fixos') A.renderTable(fM, 'table-body', 'table-empty', 'gasto');
        if (t === 'unicos') A.renderTable(uM, 'table-body', 'table-empty', 'gasto');
        if (t === 'entradas') A.renderTable(eM, 'table-entradas', 'entradas-empty', 'entrada');
        if (t === 'annual') A.renderAnnual(yVal);
        A.updateCharts();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    animateValue(id, value) {
        const el = document.getElementById(id); if (!el) return;
        el.textContent = A.fmtR(value);
    },

    renderDRE(mVal, yVal) {
        const eM = A.filterData(A.state.data.entradas, mVal, yVal);
        const fM = A.filterData(A.state.data.fixos, mVal, yVal);
        const uM = A.filterData(A.state.data.unicos, mVal, yVal);
        // Subdivisão de Receita Bruta
        const rbSetup = eM.filter(x => x.categoria === 'Receita de Setup (Pontual)').reduce((a, b) => a + Number(b.valor), 0);
        const rbMensal = eM.filter(x => x.categoria === 'Receita de Mensalidades (Recorrente)').reduce((a, b) => a + Number(b.valor), 0);
        const rbAvulso = eM.filter(x => x.categoria === 'Projetos Avulsos / Serviços Pontuais').reduce((a, b) => a + Number(b.valor), 0);
        const rbOutros = eM.filter(x => x.categoria === 'Outras Receitas').reduce((a, b) => a + Number(b.valor), 0);
        const rb = rbSetup + rbMensal + rbAvulso + rbOutros;
        // Percentuais
        const pct = (v) => rb > 0 ? ((v / rb) * 100).toFixed(1) + '%' : '0%';
        // Custos Variáveis
        const cvMarketing = uM.filter(x => x.categoria === 'Marketing (Tráfego, Campanhas)').reduce((a, b) => a + Number(b.valor), 0);
        const cvTaxas = uM.filter(x => x.categoria === 'Taxas de Meios de Pagamento').reduce((a, b) => a + Number(b.valor), 0);
        const cvFreelancers = uM.filter(x => x.categoria === 'Freelancers por Projeto').reduce((a, b) => a + Number(b.valor), 0);
        const cvTerceiros = uM.filter(x => x.categoria === 'Serviços Terceirizados Pontuais').reduce((a, b) => a + Number(b.valor), 0);
        const cvAPIs = uM.filter(x => x.categoria === 'APIs e Consumo Variável').reduce((a, b) => a + Number(b.valor), 0);
        const cvImpostos = uM.filter(x => x.categoria === 'Impostos sobre Faturamento').reduce((a, b) => a + Number(b.valor), 0);
        const cvOutros = uM.filter(x => !['Marketing (Tráfego, Campanhas)','Taxas de Meios de Pagamento','Freelancers por Projeto','Serviços Terceirizados Pontuais','APIs e Consumo Variável','Impostos sobre Faturamento'].includes(x.categoria)).reduce((a, b) => a + Number(b.valor), 0);
        const cv = cvMarketing + cvTaxas + cvFreelancers + cvTerceiros + cvAPIs + cvImpostos + cvOutros;
        // Margem Bruta
        const mb = rb - cv;
        // Custos Fixos
        const cfContab = fM.filter(x => x.categoria === 'Contabilidade').reduce((a, b) => a + Number(b.valor), 0);
        const cfFerramentas = fM.filter(x => x.categoria === 'Ferramentas (Google, Software, etc.)').reduce((a, b) => a + Number(b.valor), 0);
        const cfHospedagem = fM.filter(x => x.categoria === 'Hospedagem / Infraestrutura').reduce((a, b) => a + Number(b.valor), 0);
        const cfProlabore = fM.filter(x => x.categoria === 'Pró-labore').reduce((a, b) => a + Number(b.valor), 0);
        const cfTaxas = fM.filter(x => x.categoria === 'Taxas Bancárias Fixas').reduce((a, b) => a + Number(b.valor), 0);
        const cfOutros = fM.filter(x => x.categoria === 'Outros Custos Fixos').reduce((a, b) => a + Number(b.valor), 0);
        const cf = cfContab + cfFerramentas + cfHospedagem + cfProlabore + cfTaxas + cfOutros;
        // Resultado Operacional
        const ro = mb - cf;
        // Impostos
        const impostosSimples = cvImpostos;
        const impostosOutros = uM.filter(x => !['Impostos sobre Faturamento'].includes(x.categoria) && x.categoria.toLowerCase().includes('imposto')).reduce((a, b) => a + Number(b.valor), 0);
        const impostos = impostosSimples + impostosOutros;
        // Resultado Líquido
        const rl = ro - impostos;
        let h = `
            <tr class="dre-row-main"><td>1. RECEITA BRUTA</td><td class="dre-val dre-positive">${A.fmtR(rb)} <span class="dre-pct">100%</span></td><td>-</td></tr>
            <tr><td colspan="3" style="background:rgba(14,165,233,0.05)">
                <div style="display:flex;gap:16px">
                    <div>Setup: <b>${A.fmtR(rbSetup)}</b> <span class="dre-pct">${pct(rbSetup)}</span></div>
                    <div>Mensalidades: <b>${A.fmtR(rbMensal)}</b> <span class="dre-pct">${pct(rbMensal)}</span></div>
                    <div>Avulsos: <b>${A.fmtR(rbAvulso)}</b> <span class="dre-pct">${pct(rbAvulso)}</span></div>
                    <div>Outros: <b>${A.fmtR(rbOutros)}</b> <span class="dre-pct">${pct(rbOutros)}</span></div>
                </div>
            </td></tr>
            <tr class="dre-row-main"><td>2. (-) CUSTOS VARIÁVEIS</td><td class="dre-val dre-negative">-${A.fmtR(cv)} <span class="dre-pct">${pct(cv)}</span></td><td>-</td></tr>
            <tr><td colspan="3" style="background:rgba(239,68,68,0.05)">
                <div style="display:flex;gap:16px">
                    <div>Marketing: <b>${A.fmtR(cvMarketing)}</b></div>
                    <div>Taxas: <b>${A.fmtR(cvTaxas)}</b></div>
                    <div>Freelancers: <b>${A.fmtR(cvFreelancers)}</b></div>
                    <div>Terceiros: <b>${A.fmtR(cvTerceiros)}</b></div>
                    <div>APIs: <b>${A.fmtR(cvAPIs)}</b></div>
                    <div>Impostos: <b>${A.fmtR(cvImpostos)}</b></div>
                    <div>Outros: <b>${A.fmtR(cvOutros)}</b></div>
                </div>
            </td></tr>
            <tr class="dre-row-main"><td>3. (=) MARGEM BRUTA</td><td class="dre-val">${A.fmtR(mb)} <span class="dre-pct">${pct(mb)}</span></td><td>-</td></tr>
            <tr class="dre-row-main"><td>4. (-) CUSTOS FIXOS</td><td class="dre-val dre-negative">-${A.fmtR(cf)} <span class="dre-pct">${pct(cf)}</span></td><td>-</td></tr>
            <tr><td colspan="3" style="background:rgba(34,197,94,0.05)">
                <div style="display:flex;gap:16px">
                    <div>Contabilidade: <b>${A.fmtR(cfContab)}</b></div>
                    <div>Ferramentas: <b>${A.fmtR(cfFerramentas)}</b></div>
                    <div>Hospedagem: <b>${A.fmtR(cfHospedagem)}</b></div>
                    <div>Pró-labore: <b>${A.fmtR(cfProlabore)}</b></div>
                    <div>Taxas Bancárias: <b>${A.fmtR(cfTaxas)}</b></div>
                    <div>Outros: <b>${A.fmtR(cfOutros)}</b></div>
                </div>
            </td></tr>
            <tr class="dre-row-main"><td>5. (=) RESULTADO OPERACIONAL</td><td class="dre-val">${A.fmtR(ro)} <span class="dre-pct">${pct(ro)}</span></td><td>-</td></tr>
            <tr class="dre-row-main"><td>6. (-) IMPOSTOS</td><td class="dre-val dre-negative">-${A.fmtR(impostos)} <span class="dre-pct">${pct(impostos)}</span></td><td>-</td></tr>
            <tr><td colspan="3" style="background:rgba(253,186,116,0.05)">
                <div style="display:flex;gap:16px">
                    <div>Simples Nacional: <b>${A.fmtR(impostosSimples)}</b></div>
                    <div>Outros Tributos: <b>${A.fmtR(impostosOutros)}</b></div>
                </div>
            </td></tr>
            <tr class="dre-row-main" style="background:rgba(14,165,233,0.1)"><td>7. (=) RESULTADO LÍQUIDO</td><td class="dre-val ${rl >= 0 ? 'dre-positive' : 'dre-negative'}">${A.fmtR(rl)} <span class="dre-pct">${pct(rl)}</span></td><td>-</td></tr>
        `;
        document.getElementById('dre-tbody').innerHTML = h;
    },

    renderTable(list, tbodyId, emptyId, tipo) {
        const searchQ = (document.getElementById(tipo === 'entrada' ? 'search-entradas' : 'search-gastos')?.value || '').toLowerCase();
        const filtered = list.filter(i => (i.nome || '').toLowerCase().includes(searchQ) || (i.categoria || '').toLowerCase().includes(searchQ));
        const sorted = [...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
        const tbody = document.getElementById(tbodyId), empty = document.getElementById(emptyId);
        if (!tbody) return;
        if (sorted.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; }
        else {
            if (empty) empty.style.display = 'none';
            tbody.innerHTML = sorted.map((i) => `<tr>
                <td>${A.fmtD(i.data)}</td>
                <td><div class="item-name">${esc(i.nome)}</div></td>
                <td><span class="cat-badge">${esc(i.categoria || '—')}</span></td>
                <td>${i.recorrente === 'unico' ? 'Único' : '🔄'}</td>
                <td><span class="status-badge ${i.status === 'Pendente' ? 'pendente' : 'pago'}">${i.status}</span></td>
                <td class="amount-cell">${A.fmtR(i.valor)}</td>
                <td style="text-align:center">
                    <button class="action-btn" onclick="A.edit('${i.id}')"><i data-lucide="edit-2" width="14"></i></button>
                    <button class="action-btn danger" onclick="A.deleteItem('${i.id}', '${tipo}')" title="Remover"><i data-lucide="trash" width="14"></i></button>
                </td></tr>`).join('');
            deleteItem(id, tipo) {
                let key;
                if (tipo === 'entrada') key = 'entradas';
                else if (tipo === 'gasto') {
                    // Determinar se é fixo ou único
                    const item = [...A.state.data.fixos, ...A.state.data.unicos].find(x => x.id === id);
                    key = A.state.data.fixos.some(x => x.id === id) ? 'fixos' : 'unicos';
                }
                else return;
                A.state.data[key] = A.state.data[key].filter(x => x.id !== id);
                A.render();
                A.pushSync();
            },
        }
    },

    renderAnnual(year) {
        const grid = document.getElementById('annual-grid'); if (!grid) return;
        let h = '';
        for (let i = 0; i < 12; i++) {
            const e = A.filterData(A.state.data.entradas, i.toString(), year).reduce((a, b) => a + Number(b.valor), 0);
            const s = A.filterData(A.state.data.fixos, i.toString(), year).reduce((a, b) => a + Number(b.valor), 0) + A.filterData(A.state.data.unicos, i.toString(), year).reduce((a, b) => a + Number(b.valor), 0);
            h += `<div class="month-tile" onclick="A.openMonthModal(${i},'${year}')">
                <div class="month-tile-name">${MONTHS[i]}</div>
                <div style="color:var(--success)">+ ${A.fmtR(e)}</div>
                <div style="color:var(--danger)">- ${A.fmtR(s)}</div>
            </div>`;
        }
        grid.innerHTML = h;
    },

    openDrawer(item = null, modo = null) {
        document.getElementById('drawer').classList.add('open'); document.getElementById('overlay').classList.add('open');
        if (item) {
            document.getElementById('f-id').value = item.id;
            document.getElementById('f-nome').value = item.nome;
            document.getElementById('f-valor').value = A.fmtR(item.valor).replace(/[^\d,]/g, '');
            document.getElementById('f-data').value = item.data;
        } else {
            A.setModo(modo || 'despesa');
            document.getElementById('f-id').value = ''; document.getElementById('f-nome').value = '';
        }
        A.setType('fixos');
    },
    closeDrawer() { document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); },
    setModo(m) { A.state.modo = m; A.setType(m === 'entrada' ? 'entradas' : 'fixos'); },
    setType(t) {
        A.state.type = t;
        const s = document.getElementById('f-cat'); if (!s) return;
        s.innerHTML = (CATS[t] || []).map(c => `<option value="${c}">${c}</option>`).join('');
    },
    onRecorChange() { },

    async save() {
        const btn = document.getElementById('btn-add-main');
        if (btn) btn.classList.add('loading');
        const id = document.getElementById('f-id').value, nome = document.getElementById('f-nome').value, valor = A.cleanMoney(document.getElementById('f-valor').value);
        if (!nome || valor <= 0) {
            if (btn) btn.classList.remove('loading');
            return A.toast("Dados inválidos", "err");
        }
        const item = { id: id || A.genId('bgt'), nome, valor, data: document.getElementById('f-data').value, categoria: document.getElementById('f-cat').value, status: document.getElementById('f-status').value, recorrente: document.getElementById('f-recor').value };
        const key = A.state.modo === 'entrada' ? 'entradas' : A.state.type;
        A.state.data[key] = A.state.data[key].filter(x => x.id !== item.id);
        A.state.data[key].push(item);
        A.closeDrawer(); A.render(); await A.pushSync();
        if (btn) btn.classList.remove('loading');
    },

    edit(id) {
        const all = [...A.state.data.fixos, ...A.state.data.unicos, ...A.state.data.entradas];
        const item = all.find(x => x.id === id); if (item) A.openDrawer(item);
    },

    initCharts() {
        if (typeof ApexCharts === 'undefined') return;
        const opt = (color) => ({ chart: { type: 'area', height: 280, toolbar: { show: false } }, series: [], colors: [color], stroke: { curve: 'smooth' }, xaxis: { categories: [] } });
        A.ch.area = new ApexCharts(document.getElementById('chart-area'), opt('#10b981'));
        A.ch.donut = new ApexCharts(document.getElementById('chart-donut'), { chart: { type: 'donut', height: 280 }, series: [], labels: [] });
        A.ch.dreBar = new ApexCharts(document.getElementById('chart-dre-bar'), opt('#0ea5e9'));
        A.ch.dreLine = new ApexCharts(document.getElementById('chart-dre-line'), opt('#ef4444'));
        [A.ch.area, A.ch.donut, A.ch.dreBar, A.ch.dreLine].forEach(c => c.render());
    },

    updateCharts() {
        if (!A.ch.area || !A.ch.dreBar || !A.ch.dreLine) return;
        const last6 = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); last6.push(d); }
        const labels = last6.map(d => MONTHS[d.getMonth()].substring(0, 3));
        // Receita vs Custos Totais (Bar)
        const dataE = last6.map(d => A.filterData(A.state.data.entradas, d.getMonth().toString(), d.getFullYear().toString()).reduce((a, b) => a + Number(b.valor), 0));
        const dataC = last6.map(d => {
            const f = A.filterData(A.state.data.fixos, d.getMonth().toString(), d.getFullYear().toString()).reduce((a, b) => a + Number(b.valor), 0);
            const u = A.filterData(A.state.data.unicos, d.getMonth().toString(), d.getFullYear().toString()).reduce((a, b) => a + Number(b.valor), 0);
            return f + u;
        });
        A.ch.dreBar.updateSeries([
            { name: 'Receita', data: dataE },
            { name: 'Custos Totais', data: dataC }
        ]);
        A.ch.dreBar.updateOptions({ xaxis: { categories: labels } });
        // Resultado Líquido por período (Linha)
        const dataRL = last6.map((d, idx) => {
            const receita = dataE[idx];
            const custos = dataC[idx];
            // Impostos
            const u = A.filterData(A.state.data.unicos, d.getMonth().toString(), d.getFullYear().toString());
            const impostos = u.filter(x => x.categoria === 'Impostos sobre Faturamento').reduce((a, b) => a + Number(b.valor), 0);
            return receita - custos - impostos;
        });
        A.ch.dreLine.updateSeries([{ name: 'Resultado Líquido', data: dataRL }]);
        A.ch.dreLine.updateOptions({ xaxis: { categories: labels } });
    },

    toast(msg, type) {
        const wrap = document.getElementById('toast-wrap'); if (!wrap) return;
        const t = document.createElement('div'); t.className = `toast show ${type || ''}`; t.textContent = msg;
        wrap.appendChild(t); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
    },

    openProjDrawer() { }, closeProjDrawer() { }, renderProjecoes() { }, saveProj() { },
    openProjDrawer(tipo = 'entrada', item = null) {
        document.getElementById('drawer').classList.add('open');
        document.getElementById('overlay').classList.add('open');
        document.getElementById('f-id').value = item ? item.id : '';
        document.getElementById('f-nome').value = item ? item.nome : '';
        document.getElementById('f-valor').value = item ? A.fmtR(item.valor).replace(/[^\\d,]/g, '') : '';
        document.getElementById('f-data').value = item ? item.data : '';
        document.getElementById('f-cat').value = item ? item.categoria : '';
        document.getElementById('f-status').value = item ? item.status : 'Previsto';
        document.getElementById('f-recor').value = item ? item.recorrente : 'unico';
        A.state.projTipo = tipo;
        A.setType(tipo === 'entrada' ? 'entradas' : 'saidas');
    },
    closeProjDrawer() { document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); },
    renderProjecoes() {
        const tbody = document.getElementById('table-proj-body');
        if (!tbody) return;
        const entradas = A.state.data.projecoes.entradas || [];
        const saidas = A.state.data.projecoes.saidas || [];
        tbody.innerHTML = '';
        entradas.forEach(i => {
            tbody.innerHTML += `<tr><td>${A.fmtD(i.data)}</td><td>${esc(i.nome)}</td><td>${esc(i.categoria || '—')}</td><td>${A.fmtR(i.valor)}</td><td><span class="status-badge">${i.status}</span></td><td><button class="action-btn" onclick="A.editProj('${i.id}', 'entrada')"><i data-lucide="edit-2" width="14"></i></button><button class="action-btn danger" onclick="A.deleteProj('${i.id}', 'entrada')" title="Remover"><i data-lucide="trash" width="14"></i></button></td></tr>`;
        });
        saidas.forEach(i => {
            tbody.innerHTML += `<tr><td>${A.fmtD(i.data)}</td><td>${esc(i.nome)}</td><td>${esc(i.categoria || '—')}</td><td>${A.fmtR(i.valor)}</td><td><span class="status-badge">${i.status}</span></td><td><button class="action-btn" onclick="A.editProj('${i.id}', 'saida')"><i data-lucide="edit-2" width="14"></i></button><button class="action-btn danger" onclick="A.deleteProj('${i.id}', 'saida')" title="Remover"><i data-lucide="trash" width="14"></i></button></td></tr>`;
        });
    },
    saveProj() {
        const btn = document.getElementById('btn-add-main');
        if (btn) btn.classList.add('loading');
        const id = document.getElementById('f-id').value;
        const nome = document.getElementById('f-nome').value;
        const valor = A.cleanMoney(document.getElementById('f-valor').value);
        const data = document.getElementById('f-data').value;
        const categoria = document.getElementById('f-cat').value;
        const status = document.getElementById('f-status').value;
        const recorrente = document.getElementById('f-recor').value;
        if (!nome || valor <= 0) {
            if (btn) btn.classList.remove('loading');
            return A.toast("Dados inválidos", "err");
        }
        const tipo = A.state.projTipo || 'entrada';
        const item = { id: id || A.genId('proj'), nome, valor, data, categoria, status, recorrente };
        A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'] = (A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'] || []).filter(x => x.id !== item.id);
        A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'].push(item);
        A.closeProjDrawer();
        A.renderProjecoes();
        A.pushSync();
        if (btn) btn.classList.remove('loading');
    },
    editProj(id, tipo) {
        const arr = A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'] || [];
        const item = arr.find(x => x.id === id);
        if (item) A.openProjDrawer(tipo, item);
    },
    deleteProj(id, tipo) {
        const arr = A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'] || [];
        A.state.data.projecoes[tipo === 'entrada' ? 'entradas' : 'saidas'] = arr.filter(x => x.id !== id);
        A.renderProjecoes();
        A.pushSync();
    },

    setLang(l) {
        A.state.lang = l;
        const dict = LANGS[l];
        // Update sidebar and nav
        document.querySelector('[data-tab="overview"]').innerHTML = `<i data-lucide="layout-dashboard"></i> ${dict.dashboard}`;
        document.querySelector('[data-tab="dre"]').innerHTML = `<i data-lucide="calculator"></i> ${dict.dre}`;
        document.querySelector('[data-tab="annual"]').innerHTML = `<i data-lucide="calendar-range"></i> ${dict.annual}`;
        document.querySelector('[data-tab="entradas"]').innerHTML = `<i data-lucide="wallet"></i> ${dict.revenue}`;
        document.querySelector('[data-tab="fixos"]').innerHTML = `<i data-lucide="anchor"></i> ${dict.fixed}`;
        document.querySelector('[data-tab="unicos"]').innerHTML = `<i data-lucide="zap"></i> ${dict.variable}`;
        document.querySelector('[data-tab="relatorios"]').innerHTML = `<i data-lucide="file-down"></i> ${dict.export}`;
        document.querySelector('[data-tab="projecoes"]').innerHTML = `<i data-lucide="line-chart"></i> ${dict.projections}`;

        // Refresh Current View
        A.tab(A.state.tab);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Expose A to window
window.A = A;
window.esc = esc;
