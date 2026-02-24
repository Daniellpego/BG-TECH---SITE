const DB = { 
  url: "https://urpuiznydrlwmaqhdids.supabase.co/rest/v1/painel_gastos?id=eq.1", 
  key: "sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0" 
};

const CONF = { 
  admin: "bgtech", pass: "admin2024", 
  months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] 
};

const CATS = { 
  fixos: ["Software e Automação", "Nuvem e Infra", "Pró-labore e Equipe", "Marketing Fixo", "Estrutura", "Outros Custos"], 
  unicos: ["Hardware e Peças", "Tráfego Pago", "Impostos e Taxas", "Terceirizados", "Eventos", "Gasto Não Previsto"] 
};

const app = {
  state: { tab: 'overview', fType: 'fixos', data: { fixos: [], unicos: [] } },
  charts: { area: null, donut: null },

  init() {
    lucide.createIcons();
    const mSel = document.getElementById('filter-month');
    CONF.months.forEach((m, i) => mSel.innerHTML += `<option value="${i}">${m}</option>`);
    mSel.value = new Date().getMonth();

    document.getElementById('login-pass').addEventListener('keypress', e => { if(e.key === 'Enter') app.login() });
  },

  login() {
    const u = document.getElementById('login-user').value.toLowerCase().trim();
    const p = document.getElementById('login-pass').value;
    if(u === CONF.admin && p === CONF.pass) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'flex';
      app.initCharts();
      app.fetchSync();
      setInterval(() => app.fetchSync(true), 15000);
    } else {
      app.toast("Credenciais Inválidas", "error");
    }
  },

  setTab(t) {
    app.state.tab = t;
    document.querySelectorAll('.nav-btn, .m-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[onclick="app.setTab('${t}')"]`).forEach(b => b.classList.add('active'));
    
    document.getElementById('view-overview').style.display = t === 'overview' ? 'block' : 'none';
    document.getElementById('view-list').style.display = t !== 'overview' ? 'block' : 'none';
    
    const titles = { overview: 'Resumo Financeiro', fixos: 'Estrutura Fixa Operacional', unicos: 'Mapeamento de Variáveis' };
    document.getElementById('page-title').innerText = titles[t];
    app.render();
  },

  async fetchSync(silent = false) {
    if(!silent) app.syncUI('loading');
    try {
      const res = await fetch(DB.url, { headers: { 'apikey': DB.key, 'Authorization': `Bearer ${DB.key}` }});
      const d = await res.json();
      if (d && d[0]) {
        app.state.data.fixos = Array.isArray(d[0].fixos) ? d[0].fixos : JSON.parse(d[0].fixos || '[]');
        app.state.data.unicos = Array.isArray(d[0].unicos) ? d[0].unicos : JSON.parse(d[0].unicos || '[]');
      }
      app.syncUI('online');
      app.render();
    } catch(e) { app.syncUI('error'); }
  },

  async pushSync() {
    app.syncUI('loading');
    try {
      await fetch(DB.url, {
        method: 'PATCH',
        headers: { 'apikey': DB.key, 'Authorization': `Bearer ${DB.key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ fixos: app.state.data.fixos, unicos: app.state.data.unicos, updated_at: new Date().toISOString() })
      });
      app.syncUI('online');
    } catch(e) { 
      app.toast("Aviso: Falha ao enviar para a nuvem.", "error"); 
      app.syncUI('error'); 
    }
  },

  syncUI(state) {
    const dot = document.getElementById('sync-indicator');
    const txt = document.getElementById('sync-text');
    dot.className = 'sync-dot';
    if(state === 'loading') { dot.classList.add('loading'); txt.innerText = "Sincronizando..."; }
    else if(state === 'online') { dot.style.background = 'var(--success)'; dot.style.boxShadow = '0 0 10px var(--success)'; txt.innerText = "Nuvem Conectada"; }
    else { dot.style.background = 'var(--danger)'; dot.style.boxShadow = '0 0 10px var(--danger)'; txt.innerText = "Modo Offline"; }
  },

  maskCurrency(e) {
    let v = e.target.value.replace(/\D/g, "");
    if(!v) { e.target.value = ""; return; }
    v = (parseInt(v) / 100).toFixed(2);
    e.target.value = v.replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  },
  
  cleanMoney(str) { return parseFloat((str||"0").replace(/\./g, '').replace(',', '.')); },
  fmtR(v) { return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(v||0); },
  fmtD(d) { if(!d) return "--/--"; const p = d.split('-'); return p.length===3 ? `${p[2]}/${p[1]}` : d; },

  render() {
    const mes = parseInt(document.getElementById('filter-month').value);
    const ano = parseInt(document.getElementById('filter-year').value);
    
    const filterFn = (x) => { if(!x.data) return false; const p = x.data.split('-'); return parseInt(p[1])-1===mes && parseInt(p[0])===ano; };
    
    const fixos = app.state.data.fixos.filter(filterFn);
    const unicos = app.state.data.unicos.filter(filterFn);
    
    const sumF = fixos.reduce((a,b) => a + Number(b.valor), 0);
    const sumU = unicos.reduce((a,b) => a + Number(b.valor), 0);

    document.getElementById('val-total').innerText = app.fmtR(sumF + sumU);
    document.getElementById('val-fixos').innerText = app.fmtR(sumF);
    document.getElementById('val-unicos').innerText = app.fmtR(sumU);

    if(app.state.tab !== 'overview') {
      const list = (app.state.tab === 'fixos' ? fixos : unicos).sort((a,b) => b.data.localeCompare(a.data));
      const tbody = document.getElementById('table-body');
      const empty = document.getElementById('empty-table');
      
      if(list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; }
      else {
        empty.style.display = 'none';
        tbody.innerHTML = list.map(i => `
          <tr>
            <td style="color:var(--text-muted); font-weight:600;">${app.fmtD(i.data)}</td>
            <td><div style="font-weight:700; font-size:15px; color:white;">${i.nome}</div><div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${i.descricao||'-'}</div></td>
            <td><span style="background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; color:var(--text-muted);">${i.categoria}</span></td>
            <td><span class="status-badge ${i.status==='Pendente'?'pendente':'pago'}"><i data-lucide="${i.status==='Pendente'?'clock':'check'}" style="width:12px;"></i> ${i.status}</span></td>
            <td class="font-title" style="text-align:right; font-size:16px; font-weight:800; color:${i.status==='Pendente'?'var(--text-muted)':'white'};">${app.fmtR(i.valor)}</td>
            <td style="text-align:center;">
              <button class="action-icon" onclick="app.editItem('${i.id}')"><i data-lucide="edit-2" style="width:18px;"></i></button>
              <button class="action-icon del" onclick="app.deleteItem('${i.id}')"><i data-lucide="trash-2" style="width:18px;"></i></button>
            </td>
          </tr>
        `).join('');
        lucide.createIcons(); 
      }
    }
    app.updateCharts();
  },

  initCharts() {
    const optArea = {
      series: [{ name: 'Gasto Total', data: [] }],
      chart: { type: 'area', height: 350, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter' },
      colors: ['#0ea5e9'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.05, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 4 },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
      xaxis: { categories: [], labels: { style: { colors: '#94a3b8', fontWeight: 600 } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (v) => `R$${(v/1000).toFixed(0)}k` } },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark', y: { formatter: v => app.fmtR(v) } }
    };
    app.charts.area = new ApexCharts(document.querySelector("#chart-area"), optArea);
    app.charts.area.render();

    const optDonut = {
      series: [], labels: [],
      chart: { type: 'donut', height: 300, background: 'transparent', fontFamily: 'Inter' },
      colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7', '#0369a1'],
      stroke: { show: true, colors: ['#0f172a'], width: 2 },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
      plotOptions: { pie: { donut: { size: '75%', labels: { show: true, name: { color: '#94a3b8' }, value: { color: 'white', fontSize: '24px', fontWeight: 800, formatter: v => app.fmtR(v) }, total: { show: true, label: 'Fixos', color: '#94a3b8', formatter: w => app.fmtR(w.globals.seriesTotals.reduce((a,b)=>a+b,0)) } } } } },
      theme: { mode: 'dark' }
    };
    app.charts.donut = new ApexCharts(document.querySelector("#chart-donut"), optDonut);
    app.charts.donut.render();
  },

  updateCharts() {
    if(!app.charts.area) return;
    const areaData = []; const areaCats = [];
    for(let i=5; i>=0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), a = d.getFullYear();
      const f = app.state.data.fixos.filter(x => {const p=x.data?.split('-'); return parseInt(p?.[1])-1===m && parseInt(p?.[0])===a}).reduce((s,x)=>s+Number(x.valor),0);
      const v = app.state.data.unicos.filter(x => {const p=x.data?.split('-'); return parseInt(p?.[1])-1===m && parseInt(p?.[0])===a}).reduce((s,x)=>s+Number(x.valor),0);
      areaData.push(f+v); areaCats.push(CONF.months[m].substring(0,3));
    }
    app.charts.area.updateSeries([{ data: areaData }]);
    app.charts.area.updateOptions({ xaxis: { categories: areaCats } });

    const mes = parseInt(document.getElementById('filter-month').value);
    const ano = parseInt(document.getElementById('filter-year').value);
    const curFixos = app.state.data.fixos.filter(x => {const p=x.data?.split('-'); return parseInt(p?.[1])-1===mes && parseInt(p?.[0])===ano});
    
    const catMap = {};
    curFixos.forEach(x => { catMap[x.categoria] = (catMap[x.categoria]||0) + Number(x.valor); });
    const labels = Object.keys(catMap);
    const series = Object.values(catMap);
    
    if(series.length > 0) {
      app.charts.donut.updateOptions({ labels: labels });
      app.charts.donut.updateSeries(series);
    } else {
      app.charts.donut.updateSeries([1]);
      app.charts.donut.updateOptions({ labels: ['Sem Dados'], colors: ['#1e293b'] });
    }
  },

  openDrawer(item = null) {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer-title').innerText = item ? 'Editar Gasto' : 'Novo Lançamento';
    
    if (item) {
      const isFixo = app.state.data.fixos.some(i => i.id === item.id);
      app.setFormType(isFixo ? 'fixos' : 'unicos');
      document.getElementById('form-id').value = item.id;
      document.getElementById('form-nome').value = item.nome;
      document.getElementById('form-valor').value = app.fmtR(item.valor).replace('R$', '').trim();
      document.getElementById('form-data').value = item.data;
      document.getElementById('form-categoria').value = item.categoria;
      document.getElementById('form-status').value = item.status || 'Pago';
      document.getElementById('form-desc').value = item.descricao || '';
    } else {
      app.setFormType(app.state.tab === 'overview' ? 'fixos' : app.state.tab);
      document.getElementById('form-id').value = '';
      document.getElementById('form-nome').value = '';
      document.getElementById('form-valor').value = '';
      document.getElementById('form-data').value = new Date().toISOString().split('T')[0];
      document.getElementById('form-status').value = 'Pago';
      document.getElementById('form-desc').value = '';
    }
  },

  closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
  },

  setFormType(t) {
    app.state.fType = t;
    document.getElementById('btn-t-fixos').classList.toggle('active', t === 'fixos');
    document.getElementById('btn-t-unicos').classList.toggle('active', t === 'unicos');
    
    const sel = document.getElementById('form-categoria');
    sel.innerHTML = '';
    CATS[t].forEach(c => sel.innerHTML += `<option value="${c}" style="background:#0f172a">${c}</option>`);
  },

  saveData() {
    const nome = document.getElementById('form-nome').value.trim();
    const valor = app.cleanMoney(document.getElementById('form-valor').value);
    if(!nome || valor <= 0) return app.toast("Obrigatório nome e valor válido.", "error");

    const obj = {
      id: document.getElementById('form-id').value || `bgt_${Date.now()}`,
      nome: nome, valor: valor,
      data: document.getElementById('form-data').value,
      categoria: document.getElementById('form-categoria').value,
      status: document.getElementById('form-status').value,
      descricao: document.getElementById('form-desc').value.trim()
    };

    const targetArr = app.state.data[app.state.fType];
    const idx = targetArr.findIndex(i => i.id === obj.id);
    
    if (idx >= 0) targetArr[idx] = obj; else targetArr.push(obj);

    const otherArr = app.state.fType === 'fixos' ? 'unicos' : 'fixos';
    app.state.data[otherArr] = app.state.data[otherArr].filter(i => i.id !== obj.id);

    app.closeDrawer();
    app.render(); 
    app.pushSync(); 
    app.toast("Salvo no Cofre BG Tech!");
  },

  editItem(id) {
    const item = app.state.data.fixos.find(i=>i.id===id) || app.state.data.unicos.find(i=>i.id===id);
    if(item) app.openDrawer(item);
  },

  deleteItem(id) {
    if(confirm("Confirma exclusão permanente deste registro?")) {
      app.state.data.fixos = app.state.data.fixos.filter(i=>i.id!==id);
      app.state.data.unicos = app.state.data.unicos.filter(i=>i.id!==id);
      app.render();
      app.pushSync();
      app.toast("Registro apagado.");
    }
  },

  toast(msg, type='success') {
    const box = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i data-lucide="${type==='error'?'alert-circle':'check-circle'}" color="${type==='error'?'#ef4444':'#10b981'}"></i> <span>${msg}</span>`;
    box.appendChild(t);
    lucide.createIcons();
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(), 400); }, 3500);
  }
};

window.onload = app.init;
