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
    },

    genId(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9); },

    login() {
        const u = document.getElementById('lu').value.trim().toLowerCase(), p = document.getElementById('lp').value, lc = document.getElementById('login-card');
        const btn = document.getElementById('btn-login');
        if ((u === 'bgtech' || u === 'gustavo' || u === 'gui') && p === 'admin2024') {
            if (btn) btn.classList.add('loading');
            lc.style.animation = 'none'; lc.style.transform = 'scale(1.05)'; lc.style.opacity = '0'; lc.style.transition = 'all 0.5s ease';
            setTimeout(() => {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app').classList.add('visible');
                if (u === 'gustavo') {
                    const msg = document.getElementById('msg-gustavo');
                    if (msg) msg.classList.add('active');
                }
                A.initCharts();
                A.fetchSync();
                setInterval(() => A.fetchSync(true), 15000);
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
        } catch (e) { A.syncUI('err'); }
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
        } catch (e) { A.syncUI('err'); A.toast("Erro ao salvar.", "warning"); }
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
        const eM = A.filterData(A.state.data.entradas, mVal, yVal), fM = A.filterData(A.state.data.fixos, mVal, yVal), uM = A.filterData(A.state.data.unicos, mVal, yVal);
        const sumE = eM.reduce((a, b) => a + Number(b.valor), 0), sumF = fM.reduce((a, b) => a + Number(b.valor), 0), sumU = uM.reduce((a, b) => a + Number(b.valor), 0), sumBurn = sumF + sumU;
        const resLiq = sumE - sumBurn, margem = sumE > 0 ? ((resLiq / sumE) * 100).toFixed(1) : '0.0';
        const runway = sumBurn > 0 ? (A.state.data.caixa_disponivel / sumBurn).toFixed(1) : '99+';

        if (t === 'overview') {
            A.animateValue('v-caixa', A.state.data.caixa_disponivel);
            document.getElementById('v-runway').textContent = `${runway} Meses`;
            A.animateValue('v-receita-ov', sumE); A.animateValue('v-burn-ov', sumBurn);
            A.animateValue('v-fixos-ov', sumF); A.animateValue('v-var-ov', sumU);
            const elRes = document.getElementById('v-res-liq'), subRes = document.getElementById('v-res-liq-sub');
            if (elRes) { elRes.textContent = (resLiq >= 0 ? '+ ' : '- ') + A.fmtR(Math.abs(resLiq)); elRes.style.color = resLiq >= 0 ? 'var(--success)' : 'var(--danger)'; }
            if (subRes) subRes.innerHTML = `<span class="trend-badge ${resLiq >= 0 ? 'up' : 'down'}">${resLiq >= 0 ? 'Lucro' : 'Prejuízo'}: ${margem}%</span>`;
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
        const rb = eM.reduce((a, b) => a + Number(b.valor), 0), cv = uM.reduce((a, b) => a + Number(b.valor), 0), cf = fM.reduce((a, b) => a + Number(b.valor), 0);
        const mb = rb - cv, rl = mb - cf;
        const pct = (v) => rb > 0 ? ((v / rb) * 100).toFixed(1) + '%' : '0%';

        let h = `
            <tr class="dre-row-main"><td>1. RECEITA BRUTA</td><td class="dre-val dre-positive">${A.fmtR(rb)} <span class="dre-pct">100%</span></td><td>-</td></tr>
            <tr class="dre-row-main"><td>2. (-) CUSTOS VARIÁVEIS</td><td class="dre-val dre-negative">-${A.fmtR(cv)} <span class="dre-pct">${pct(cv)}</span></td><td>-</td></tr>
            <tr class="dre-row-main"><td>3. (=) MARGEM BRUTA</td><td class="dre-val">${A.fmtR(mb)} <span class="dre-pct">${pct(mb)}</span></td><td>-</td></tr>
            <tr class="dre-row-main"><td>4. (-) CUSTOS FIXOS</td><td class="dre-val dre-negative">-${A.fmtR(cf)} <span class="dre-pct">${pct(cf)}</span></td><td>-</td></tr>
            <tr class="dre-row-main" style="background:rgba(14,165,233,0.1)"><td>5. (=) RESULTADO LÍQUIDO</td><td class="dre-val ${rl >= 0 ? 'dre-positive' : 'dre-negative'}">${A.fmtR(rl)} <span class="dre-pct">${pct(rl)}</span></td><td>-</td></tr>
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
                <td style="text-align:center"><button class="action-btn" onclick="A.edit('${i.id}')"><i data-lucide="edit-2" width="14"></i></button></td></tr>`).join('');
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
        const id = document.getElementById('f-id').value, nome = document.getElementById('f-nome').value, valor = A.cleanMoney(document.getElementById('f-valor').value);
        if (!nome || valor <= 0) return A.toast("Dados inválidos", "err");
        const item = { id: id || A.genId('bgt'), nome, valor, data: document.getElementById('f-data').value, categoria: document.getElementById('f-cat').value, status: document.getElementById('f-status').value, recorrente: document.getElementById('f-recor').value };
        const key = A.state.modo === 'entrada' ? 'entradas' : A.state.type;
        A.state.data[key] = A.state.data[key].filter(x => x.id !== item.id);
        A.state.data[key].push(item);
        A.closeDrawer(); A.render(); await A.pushSync();
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
        if (!A.ch.area) return;
        const last6 = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); last6.push(d); }
        const labels = last6.map(d => MONTHS[d.getMonth()].substring(0, 3));
        const dataE = last6.map(d => A.filterData(A.state.data.entradas, d.getMonth().toString(), d.getFullYear().toString()).reduce((a, b) => a + Number(b.valor), 0));
        A.ch.area.updateSeries([{ name: 'Receita', data: dataE }]);
        A.ch.area.updateOptions({ xaxis: { categories: labels } });
    },

    toast(msg, type) {
        const wrap = document.getElementById('toast-wrap'); if (!wrap) return;
        const t = document.createElement('div'); t.className = `toast show ${type || ''}`; t.textContent = msg;
        wrap.appendChild(t); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
    },

    openProjDrawer() { }, closeProjDrawer() { }, renderProjecoes() { }, saveProj() { },
    openExportModal() { }, closeExportModal() { }, runExport() { }, openMonthModal() { }, closeMonthModal() { },

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
