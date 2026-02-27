/* eslint-disable */
export const bodyHTML = `
<div class="bg-grid"></div>
<div class="bg-glow bg-glow-1"></div>
<div class="bg-glow bg-glow-2"></div>

<div id="login-screen">
  <div class="card login-card" id="login-card">
    <div class="login-logo"><i data-lucide="cpu" width="44" height="44"></i><h1>BG <span>TECH</span></h1></div>
    <div style="text-align:center"><span class="login-badge"><i data-lucide="shield-check" width="16" height="16"></i> Acesso Restrito CFO</span></div>
    <div class="login-field"><input type="text" id="lu" class="login-input" placeholder="ID de Acesso (ex: gustavo)" autocomplete="username"><i data-lucide="user" width="20" height="20" class="login-icon"></i></div>
    <div class="login-field" style="margin-bottom:40px"><input type="password" id="lp" class="login-input" placeholder="Senha do Cofre" autocomplete="current-password"><i data-lucide="key" width="20" height="20" class="login-icon"></i></div>
    <button class="btn-primary" id="btn-login" style="width:100%;padding:18px;font-size:16px;justify-content:center" onclick="A.login()">Destrancar Sistema <i data-lucide="arrow-right" width="20" height="20"></i></button>
  </div>
</div>

<div class="app" id="app">
  <aside class="sidebar" id="sidebar" role="navigation">
    <div class="sidebar-logo"><i data-lucide="cpu" width="28" height="28"></i><h1>BG <span>TECH</span></h1></div>
    <nav>
      <div class="nav-section-label">Visão Executiva</div>
      <button class="nav-btn active" data-tab="overview" onclick="A.tab('overview')"><i data-lucide="layout-dashboard"></i> Painel Geral</button>
      <button class="nav-btn" data-tab="dre" onclick="A.tab('dre')" style="color:var(--success)"><i data-lucide="calculator"></i> DRE Gerencial</button>
      <button class="nav-btn" data-tab="annual" onclick="A.tab('annual')"><i data-lucide="calendar-range"></i> Balanço Anual</button>
      <div class="nav-section-label">Lançamentos Financeiros</div>
      <button class="nav-btn" data-tab="entradas" onclick="A.tab('entradas')"><i data-lucide="wallet"></i> Receitas</button>
      <button class="nav-btn" data-tab="fixos" onclick="A.tab('fixos')"><i data-lucide="anchor"></i> Custos Fixos</button>
      <button class="nav-btn" data-tab="unicos" onclick="A.tab('unicos')"><i data-lucide="zap"></i> Gastos Variáveis</button>
      <div class="nav-section-label">Análise &amp; Simulação</div>
      <button class="nav-btn" data-tab="relatorios" onclick="A.tab('relatorios')"><i data-lucide="file-down"></i> Exportar</button>
      <button class="nav-btn" data-tab="projecoes" onclick="A.tab('projecoes')"><i data-lucide="line-chart"></i> Projeções</button>
    </nav>
    <div style="margin-top:auto; padding:0 20px 20px">
        <label style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:700; display:block; margin-bottom:8px">Idioma / Language</label>
        <select id="lang-selector" onchange="A.setLang(this.value)" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--color-border); color:white; padding:8px; border-radius:6px; font-size:12px; cursor:pointer">
            <option value="pt-BR">🇧🇷 Português</option>
            <option value="en-US">🇺🇸 English</option>
        </select>
    </div>
    <div class="sidebar-footer"><div class="sync-dot" id="sync-dot"></div><span id="sync-txt">Conectado</span></div>
  </aside>

  <div class="main-wrapper">
    <div id="msg-gustavo">
      <div style="padding:12px;background:rgba(14,165,233,0.2);border-radius:50%"><i data-lucide="trending-up" width="32" height="32" style="color:var(--primary)"></i></div>
      <div><h2 class="font-title" style="font-size:24px;font-weight:900;color:white;margin-bottom:4px">Seja bem vindo, Gustavo... o CFO mais foda da porra toda 🚀</h2><p style="color:var(--primary);font-weight:600;font-size:14px">Seu cockpit financeiro da BG Tech está 100% sincronizado e pronto para operar.</p></div>
    </div>

    <main class="main" id="main-content">
      <header class="page-header">
        <div><h2 class="page-title font-title" id="page-title">Painel Geral</h2><p class="page-sub" id="page-sub"><i data-lucide="activity" width="16" height="16"></i> Visão executiva para decisão rápida</p></div>
        <div class="header-right">
          <div class="filter-group" id="main-filters">
            <select id="fMonth" class="filter-select" onchange="A.render()"><option value="anual">📊 Balanço Anual</option></select>
            <div class="filter-sep"></div>
            <select id="fYear" class="filter-select" onchange="A.render()"><option value="2025">2025</option><option value="2026" selected>2026</option></select>
          </div>
          <button class="btn-primary" id="btn-add-main" onclick="A.openDrawer()"><i data-lucide="plus" width="18" height="18"></i> <span id="btn-add-label">Novo Lançamento</span></button>
        </div>
      </header>

      <div id="view-overview" class="view active" role="tabpanel">
        <div id="status-banner" class="verde"><i data-lucide="check-circle" width="20" height="20"></i><span><strong>Status da Operação:</strong> Calculando saúde financeira...</span></div>
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:12px 20px;margin-bottom:24px;display:inline-flex;align-items:center;gap:10px"><i data-lucide="info" width="16" height="16" style="color:var(--text-muted)"></i><span style="font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em">O Painel Geral existe para decidir rápido, com base em caixa, resultado e tendência.</span></div>
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
          <div class="card stat-card c-success" style="border-top-width:4px;background:linear-gradient(180deg,rgba(16,185,129,0.05),transparent)"><div class="stat-label">Caixa Disponível <button onclick="A.editCaixa()" style="background:none;border:none;cursor:pointer;color:var(--text-dim)"><i data-lucide="edit-3" width="14" height="14"></i></button></div><div class="stat-value font-title" id="v-caixa" style="color:var(--success)">R$ 0,00</div><div class="stat-sub"><i data-lucide="landmark" width="14" height="14"></i> Saldo na conta bancária</div></div>
          <div class="card stat-card c-purple" id="card-runway" style="border-top-width:4px;background:linear-gradient(180deg,rgba(168,85,247,0.05),transparent)"><div class="stat-label">Runway (Sobrevivência) <i data-lucide="timer" width="18" height="18" style="color:#a855f7"></i></div><div class="stat-value font-title" id="v-runway" style="color:#a855f7">0,0 Meses</div><div class="stat-sub"><i data-lucide="shield" width="14" height="14"></i> Caixa ÷ Burn Rate Mensal</div></div>
          <div class="card stat-card" id="card-res-liq" style="border-top-width:4px"><div class="stat-label">Resultado Líquido <i data-lucide="scale" width="18" height="18" id="icon-res-liq"></i></div><div class="stat-value font-title" id="v-res-liq">R$ 0,00</div><div class="stat-sub" id="v-res-liq-sub"><span class="trend-badge neutral">0% Margem</span></div></div>
          <div class="card stat-card c-primary"><div class="stat-label">Receita Total <i data-lucide="trending-up" width="18" height="18" style="color:var(--primary)"></i></div><div class="stat-value font-title" id="v-receita-ov">R$ 0,00</div><div class="stat-sub" id="t-receita-ov"><span class="trend-badge neutral">-</span></div></div>
          <div class="card stat-card c-primary" style="border-top-color:rgba(14,165,233,0.5)"><div class="stat-label">MRR (Recorrente) <i data-lucide="repeat" width="18" height="18" style="color:var(--primary)"></i></div><div class="stat-value font-title" id="v-mrr-ov">R$ 0,00</div><div class="stat-sub" id="t-mrr-ov"><span class="trend-badge neutral">-</span></div></div>
          <div class="card stat-card c-danger"><div class="stat-label">Burn Rate Mensal <i data-lucide="flame" width="18" height="18" style="color:var(--danger)"></i></div><div class="stat-value font-title" id="v-burn-ov" style="color:var(--danger)">R$ 0,00</div><div class="stat-sub" id="t-burn-ov"><span class="trend-badge neutral">-</span></div></div>
          <div class="card stat-card c-warning"><div class="stat-label">Custos Fixos <i data-lucide="anchor" width="18" height="18" style="color:var(--warning)"></i></div><div class="stat-value font-title" id="v-fixos-ov">R$ 0,00</div><div class="stat-sub"><i data-lucide="info" width="14" height="14"></i> Despesa estrutural</div></div>
          <div class="card stat-card c-warning" style="border-top-color:rgba(245,158,11,0.5)"><div class="stat-label">Custos Variáveis <i data-lucide="zap" width="18" height="18" style="color:var(--warning)"></i></div><div class="stat-value font-title" id="v-var-ov">R$ 0,00</div><div class="stat-sub"><i data-lucide="info" width="14" height="14"></i> Impostos e pontuais</div></div>
        </div>
        <div class="charts-row">
          <div class="card chart-card"><div class="chart-header"><span class="chart-title font-title"><i data-lucide="activity" width="20" height="20" style="color:var(--primary)"></i> Receitas vs Burn Rate</span><span class="chart-sub">Últimos 6 meses</span></div><div id="chart-area"></div></div>
          <div class="card chart-card"><div class="chart-header"><span class="chart-title font-title"><i data-lucide="pie-chart" width="20" height="20" style="color:var(--primary)"></i> Distribuição Fixos</span><span class="chart-sub">Onde o dinheiro queima</span></div><div id="chart-donut"></div></div>
        </div>
      </div>

      <div id="view-dre" class="view" role="tabpanel">
        <div style="background:linear-gradient(90deg,rgba(14,165,233,0.1),transparent);border-left:4px solid var(--primary);padding:20px 24px;border-radius:0 var(--radius-sm) var(--radius-sm) 0;margin-bottom:32px;display:flex;gap:16px;align-items:center"><i data-lucide="quote" width="24" height="24" style="color:var(--primary);opacity:0.5"></i><p style="font-size:15px;font-weight:500;color:var(--text-muted);font-style:italic">"Essa aba representa a visão financeira do CFO. <strong style="color:white">Não é contabilidade fiscal, é inteligência financeira para tomada de decisão.</strong>"</p></div>
        <div class="charts-row">
          <div class="card chart-card"><div class="chart-header"><span class="chart-title font-title"><i data-lucide="bar-chart-2" width="20" height="20" style="color:var(--primary)"></i> Receita vs Custos Totais</span></div><div id="chart-dre-bar"></div></div>
          <div class="card chart-card"><div class="chart-header"><span class="chart-title font-title"><i data-lucide="trending-up" width="20" height="20" style="color:var(--success)"></i> Resultado Líquido (6 Meses)</span></div><div id="chart-dre-line"></div></div>
        </div>
        <div class="card" style="padding:32px;overflow-x:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px"><h3 class="font-title" style="font-size:20px">Demonstração de Resultado (DRE)</h3><div style="font-size:13px;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:6px 12px;border-radius:8px">Período: <strong style="color:white" id="dre-lbl-periodo">--</strong></div></div>
          <table class="dre-table"><thead><tr><th>Estrutura do DRE</th><th>Mês / Seleção</th><th>Acumulado Ano (YTD)</th></tr></thead><tbody id="dre-tbody"></tbody></table>
        </div>
      </div>

      <div id="view-annual" class="view" role="tabpanel">
        <div class="card" style="padding:32px;margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:16px">
            <div><div class="chart-title font-title" style="font-size:24px;margin-bottom:8px" id="annual-title">Balanço Anual</div><div style="font-size:14px;color:var(--text-muted);display:flex;align-items:center;gap:8px"><i data-lucide="mouse-pointer-2" width="14" height="14"></i> Clique em um mês para visualizar o Drill Down</div></div>
            <div style="display:flex;gap:16px;flex-wrap:wrap">
              <div style="text-align:center;padding:16px 20px;background:rgba(16,185,129,0.08);border-radius:var(--radius-sm);border:1px solid rgba(16,185,129,0.25)"><div style="font-size:11px;color:var(--success);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Faturamento Ano</div><div class="font-title" style="font-size:22px;font-weight:900;color:var(--success)" id="annual-total-in">R$ 0,00</div></div>
              <div style="text-align:center;padding:16px 20px;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.25)"><div style="font-size:11px;color:var(--danger);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Gastos Ano</div><div class="font-title" style="font-size:22px;font-weight:900;color:var(--danger)" id="annual-total-out">R$ 0,00</div></div>
              <div style="text-align:center;padding:16px 20px;background:rgba(0,0,0,0.3);border-radius:var(--radius-sm);border:1px solid var(--color-border)"><div style="font-size:11px;color:var(--text-dim);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Saldo Anual</div><div class="font-title" style="font-size:22px;font-weight:900" id="annual-saldo">R$ 0,00</div></div>
            </div>
          </div>
          <div class="annual-grid" id="annual-grid"></div>
        </div>
      </div>

      <div id="view-list" class="view" role="tabpanel">
        <div class="card" style="overflow:hidden">
          <div class="search-wrap" style="position:relative"><input type="text" id="search-gastos" class="search-input" placeholder="Buscar por nome, categoria..." oninput="A.render()"><i data-lucide="search" width="16" height="16" class="search-icon"></i></div>
          <div class="table-wrap"><table class="data-table" role="table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria (DRE)</th><th>Recorrência</th><th>Status</th><th style="text-align:right">Valor</th><th style="text-align:center">Ações</th></tr></thead><tbody id="table-body"></tbody></table></div>
          <div id="table-empty" class="empty-state" style="display:none"><i data-lucide="check-circle"></i><h3>Nenhum registro encontrado</h3><p>Adicione um novo lançamento para começar.</p></div>
        </div>
      </div>

      <div id="view-entradas" class="view" role="tabpanel">
        <div class="card" style="overflow:hidden">
          <div class="search-wrap" style="position:relative"><input type="text" id="search-entradas" class="search-input" placeholder="Buscar por cliente, projeto..." oninput="A.render()"><i data-lucide="search" width="16" height="16" class="search-icon"></i></div>
          <div class="table-wrap"><table class="data-table" role="table"><thead><tr><th>Data</th><th>Descrição / Cliente</th><th>Tipo de Receita</th><th>Recorrência</th><th>Status</th><th style="text-align:right">Valor</th><th style="text-align:center">Ações</th></tr></thead><tbody id="table-entradas"></tbody></table></div>
          <div id="entradas-empty" class="empty-state" style="display:none"><i data-lucide="wallet"></i><h3>Nenhuma receita registrada</h3></div>
        </div>
      </div>

      <div id="view-relatorios" class="view" role="tabpanel">
        <div class="card" style="padding:32px">
          <div class="chart-header" style="margin-bottom:32px"><span class="chart-title font-title" style="font-size:22px"><i data-lucide="file-down" width="22" height="22" style="color:var(--primary)"></i> Exportação de Dados</span></div>
          <p style="color:var(--text-muted);margin-bottom:24px">Gere relatórios completos em PDF ou planilhas CSV para análise profunda.</p>
          <button class="btn-primary" onclick="A.openExportModal()"><i data-lucide="download" width="18" height="18"></i> Configurar e Baixar Relatório</button>
        </div>
      </div>

      <div id="view-projecoes" class="view" role="tabpanel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px">
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div class="filter-group"><select id="p-horizonte" class="filter-select" onchange="A.renderProjecoes()"><option value="3">Próximos 3 Meses</option><option value="6" selected>Próximos 6 Meses</option><option value="12">Próximos 12 Meses</option></select></div>
            <div class="filter-group"><select id="p-mes-filter" class="filter-select" onchange="A.renderProjecoes()"><option value="all">Todos os meses</option></select></div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn-success" onclick="A.openProjDrawer('entrada')"><i data-lucide="trending-up" width="16" height="16"></i> Projetar Receita</button>
            <button class="btn-primary" onclick="A.openProjDrawer('saida')" style="background:linear-gradient(135deg,var(--danger) 0%,#b91c1c 100%);box-shadow:0 4px 20px var(--danger-glow)"><i data-lucide="trending-down" width="16" height="16"></i> Projetar Custo</button>
          </div>
        </div>
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
          <div class="card stat-card c-success"><div class="stat-label">Total Entradas <i data-lucide="trending-up" width="18" height="18" style="color:var(--success)"></i></div><div class="stat-value font-title" id="p-v-entradas" style="color:var(--success)">R$ 0,00</div></div>
          <div class="card stat-card c-danger"><div class="stat-label">Total Saídas <i data-lucide="trending-down" width="18" height="18" style="color:var(--danger)"></i></div><div class="stat-value font-title" id="p-v-saidas" style="color:var(--danger)">R$ 0,00</div></div>
          <div class="card stat-card" id="p-card-saldo" style="border-top:3px solid var(--success)"><div class="stat-label">Saldo Projetado <i data-lucide="scale" width="18" height="18" style="color:var(--success)"></i></div><div class="stat-value font-title" id="p-v-saldo" style="color:var(--success)">R$ 0,00</div></div>
        </div>
        <div class="card" style="overflow:hidden">
          <div class="table-wrap"><table class="data-table" role="table"><thead><tr><th>Mês</th><th>Descrição</th><th>Categoria (DRE)</th><th>Status</th><th style="text-align:right">Valor</th><th style="text-align:center">Ações</th></tr></thead><tbody id="p-table-body"></tbody></table></div>
          <div id="p-table-empty" class="empty-state" style="display:none"><i data-lucide="bar-chart-2"></i><h3>Nenhuma projeção cadastrada</h3><p>Simule entradas e saídas futuras para antecipar seu caixa.</p></div>
        </div>
      </div>
    </main>
  </div>

  <nav class="mobile-bar" role="navigation">
    <button class="m-btn active" data-tab="overview" onclick="A.tab('overview')"><i data-lucide="layout-dashboard"></i>Painel</button>
    <button class="m-btn" data-tab="dre" onclick="A.tab('dre')"><i data-lucide="calculator"></i>DRE</button>
    <button class="m-btn" data-tab="entradas" onclick="A.tab('entradas')"><i data-lucide="wallet"></i>Entradas</button>
    <button class="m-btn" data-tab="fixos" onclick="A.tab('fixos')"><i data-lucide="anchor"></i>Saídas</button>
  </nav>
</div>

<div class="drawer-overlay" id="overlay" onclick="A.closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div class="drawer-head"><h2 class="drawer-title font-title" id="drawer-title">Novo Lançamento</h2><button class="btn-ghost" onclick="A.closeDrawer()" style="padding:10px"><i data-lucide="x" width="20" height="20"></i></button></div>
  <input type="hidden" id="f-id">
  <div class="type-tabs" id="modo-tabs" style="margin-bottom:16px"><button class="type-tab active" id="tab-modo-despesa" onclick="A.setModo('despesa')">💸 Despesa</button><button class="type-tab" id="tab-modo-entrada" onclick="A.setModo('entrada')">💰 Receita</button></div>
  <div class="type-tabs" id="sub-type-tabs"><button class="type-tab active" id="tab-fixos" onclick="A.setType('fixos')">📌 Custo Fixo</button><button class="type-tab" id="tab-unicos" onclick="A.setType('unicos')">⚡ Variável / Imposto</button></div>
  <div class="form-group"><label class="form-label" id="lbl-nome">Descrição / Fornecedor *</label><input type="text" id="f-nome" class="form-input" placeholder="Ex: Servidor AWS..." autocomplete="off"></div>
  <div class="form-grid">
    <div class="form-group"><label class="form-label">Valor (R$) *</label><input type="text" id="f-valor" class="form-input" placeholder="0,00" oninput="A.maskMoney(event)"></div>
    <div class="form-group"><label class="form-label">Data de Competência</label><input type="date" id="f-data" class="form-input"></div>
  </div>
  <div class="form-group"><label class="form-label">Recorrência</label><select id="f-recor" class="form-input" onchange="A.onRecorChange()"><option value="unico">🔴 Único</option><option value="mensal">🔄 Mensal</option><option value="proximo">📅 Próximos Meses</option></select><div class="form-hint" id="recor-hint"><i data-lucide="info" width="14" height="14"></i> Lançamento pontual.</div></div>
  <div class="form-group"><label class="form-label">Categoria (Regra DRE) *</label><select id="f-cat" class="form-input"></select></div>
  <div class="form-group"><label class="form-label" id="lbl-status">Status de Fluxo de Caixa</label><select id="f-status" class="form-input"><option value="Pago">✅ Pago / Recebido</option><option value="Pendente">⏳ Pendente</option></select></div>
  <div class="form-group"><label class="form-label">Observação (Opcional)</label><input type="text" id="f-desc" class="form-input" placeholder="Notas, link da NF..." autocomplete="off"></div>
  <button class="form-save" id="btn-save" onclick="A.save()"><i data-lucide="save" width="20" height="20"></i> Salvar Registro</button>
</div>

<div class="drawer-overlay" id="proj-overlay" onclick="A.closeProjDrawer()"></div>
<div class="drawer" id="proj-drawer">
  <div class="drawer-head"><h2 class="drawer-title font-title" id="proj-drawer-title">Nova Projeção</h2><button class="btn-ghost" onclick="A.closeProjDrawer()" style="padding:10px"><i data-lucide="x" width="20" height="20"></i></button></div>
  <input type="hidden" id="pf-id">
  <div class="type-tabs" id="proj-modo-tabs" style="margin-bottom:24px"><button class="type-tab active" id="ptab-saida" onclick="A.setProjType('saida')">💸 Projetar Saída</button><button class="type-tab" id="ptab-entrada" onclick="A.setProjType('entrada')">💰 Projetar Entrada</button></div>
  <div class="form-group"><label class="form-label">Descrição da Projeção *</label><input type="text" id="pf-nome" class="form-input" placeholder="Ex: Contratação de Dev..." autocomplete="off"></div>
  <div class="form-grid">
    <div class="form-group"><label class="form-label">Valor Estimado (R$) *</label><input type="text" id="pf-valor" class="form-input" placeholder="0,00" oninput="A.maskMoney(event)"></div>
    <div class="form-group"><label class="form-label">Mês / Competência *</label><input type="month" id="pf-mes" class="form-input"></div>
  </div>
  <div class="form-group"><label class="form-label">Categoria DRE</label><select id="pf-cat" class="form-input"></select></div>
  <div class="form-group"><label class="form-label">Grau de Certeza</label><select id="pf-status" class="form-input"><option value="Previsto">⏳ Apenas Previsto</option><option value="Confirmado">✅ Confirmado</option></select></div>
  <div class="form-group"><label class="form-label">Justificativa</label><input type="text" id="pf-desc" class="form-input" placeholder="Por que prevemos este gasto/receita?" autocomplete="off"></div>
  <button class="form-save" id="btn-proj-save" onclick="A.saveProj()"><i data-lucide="save" width="20" height="20"></i> Salvar Projeção</button>
</div>

<div class="drawer-overlay" id="month-overlay" onclick="A.closeMonthModal()"></div>
<div class="modal-month" id="month-modal">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px"><h3 class="font-title" style="font-size:22px;color:white" id="mm-title">Resumo Gerencial</h3><button class="btn-ghost" onclick="A.closeMonthModal()" style="padding:8px"><i data-lucide="x" width="16" height="16"></i></button></div>
  <div class="drill-section">
    <div style="font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">Dados Realizados</div>
    <div class="drill-row"><span>Total Receitas</span><span class="drill-val" style="color:var(--success)" id="mm-rec">R$ 0,00</span></div>
    <div class="drill-row"><span>Custos Fixos</span><span class="drill-val" style="color:var(--primary)" id="mm-fix">R$ 0,00</span></div>
    <div class="drill-row"><span>Gastos Variáveis</span><span class="drill-val" style="color:var(--warning)" id="mm-var">R$ 0,00</span></div>
    <div class="drill-row" style="border-top:1px solid var(--color-border);margin-top:8px;padding-top:16px"><span style="font-weight:700;color:white">Saldo Final</span><span class="drill-val" id="mm-saldo" style="font-size:18px">R$ 0,00</span></div>
  </div>
  <div class="drill-section" style="background:rgba(14,165,233,0.05);border-color:rgba(14,165,233,0.2)">
    <div style="font-size:11px;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">Projetado vs Realizado</div>
    <div class="drill-row"><span>Receita (Proj. vs Real)</span><span class="drill-val" id="mm-p-rec">R$ 0,00</span></div>
    <div class="drill-row"><span>Despesa (Proj. vs Real)</span><span class="drill-val" id="mm-p-desp">R$ 0,00</span></div>
  </div>
</div>

<div class="drawer-overlay" id="export-overlay" onclick="A.closeExportModal()"></div>
<div class="modal-export" id="export-modal">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px"><h3 class="font-title" style="font-size:22px;color:white;display:flex;align-items:center;gap:10px"><i data-lucide="file-down" style="color:var(--primary)"></i> Gerar Relatório</h3><button class="btn-ghost" onclick="A.closeExportModal()" style="padding:8px"><i data-lucide="x" width="16" height="16"></i></button></div>
  <div class="form-group"><label class="form-label">Formato do Arquivo</label><select id="exp-format" class="form-input"><option value="pdf">📄 Documento PDF</option><option value="csv">📊 Tabela CSV</option></select></div>
  <div class="form-group"><label class="form-label">Período de Referência</label><select id="exp-period" class="form-input"><option value="1">📅 Mês Atual</option><option value="3">📅 Trimestre</option><option value="6">📅 Semestre</option><option value="12">📅 Anual</option></select></div>
  <button class="form-save" onclick="A.runExport()"><i data-lucide="download" width="20" height="20"></i> Gerar e Baixar Arquivo</button>
</div>

<div id="toast-wrap"></div>
`;
