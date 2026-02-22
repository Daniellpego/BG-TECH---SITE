// ==== CONFIGURAÇÕES ====
const CONFIG = {
  whatsappNumber: '5511999998888',
  webhookUrl: '' // Insira sua URL do Make.com/n8n aqui
};

// Variável para armazenar a localização do Lead
let leadLocation = "sua região"; 

// Tenta buscar a localização do usuário silenciosamente no carregamento
fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => { 
      if(data.city && data.region) {
          leadLocation = data.city + " - " + data.region;
      }
  })
  .catch(e => console.log('Bloqueador de anúncio evitou a captura de IP. Usando fallback.'));

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ==== INTERAÇÕES DE UI (Header, Mobile Menu, Reveal) ====
// (Mantenha as funções initHeaderScroll, toggleMobileMenu, closeMobileMenu, initReveal, initCounters como estavam no código anterior)
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobile-menu').classList.remove('open'); }
(function initReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { observer.observe(el); });
})();

// ==== O NOVO DIAGNÓSTICO HIGH-TICKET ====
const QUESTIONS = [
  {
    id: 'gargalo',
    label: 'PASSO 01 / 06',
    title: 'Onde está o maior gargalo da sua empresa hoje?',
    desc: 'Selecione a área que está "sangrando" mais dinheiro ou tempo.',
    type: 'options',
    options: [
      { icon: 'trending-down', label: 'Vendas e Comercial', sub: 'Leads demoram a ser atendidos, conversão baixa.', score: 85 },
      { icon: 'settings', label: 'Operação e Entregas', sub: 'Retrabalho, processos manuais, equipe sobrecarregada.', score: 95 },
      { icon: 'pie-chart', label: 'Gestão e Financeiro', sub: 'Falta de dados confiáveis e previsibilidade.', score: 90 },
      { icon: 'cable', label: 'Tecnologia Fragmentada', sub: 'Sistemas não se falam, muitas planilhas.', score: 88 }
    ]
  },
  {
    id: 'caos',
    label: 'PASSO 02 / 06',
    title: 'Sendo 100% sincero, como está o nível da sua operação?',
    desc: 'Como a equipe lida com as tarefas no dia a dia?',
    type: 'options',
    options: [
      { icon: 'alert-triangle', label: 'Caótico', sub: 'Dependemos de pessoas para tudo. Erros são frequentes.', score: 98 },
      { icon: 'lock', label: 'Engessado', sub: 'Temos sistemas, mas exigem muito esforço manual.', score: 85 },
      { icon: 'activity', label: 'No limite', sub: 'Funciona hoje, mas se as vendas dobrarem, a operação quebra.', score: 92 },
      { icon: 'rocket', label: 'Controlado', sub: 'Buscamos apenas otimizações finas e integrações avançadas.', score: 70 }
    ]
  },
  {
    id: 'tamanho',
    label: 'PASSO 03 / 06',
    title: 'Quantas pessoas estão envolvidas nessa operação?',
    desc: 'Isso nos ajuda a calcular a complexidade da arquitetura de TI.',
    type: 'options',
    options: [
      { icon: 'user', label: 'Até 5 pessoas', sub: 'Equipe enxuta', score: 70 },
      { icon: 'users', label: '6 a 20 pessoas', sub: 'Crescimento ativo', score: 85 },
      { icon: 'building', label: '21 a 50 pessoas', sub: 'Departamentos estruturados', score: 92 },
      { icon: 'building-2', label: 'Mais de 50 pessoas', sub: 'Alta complexidade de gestão', score: 95 }
    ]
  },
  {
    id: 'objetivo',
    label: 'PASSO 04 / 06',
    title: 'Qual impacto financeiro você precisa para os próximos 6 meses?',
    desc: 'Se fôssemos resolver um único problema, qual traria mais ROI?',
    type: 'options',
    options: [
      { icon: 'shield-check', label: 'Estancar perda de receita', sub: 'Parar de perder vendas e clientes por falhas.', score: 90 },
      { icon: 'scissors', label: 'Reduzir custos operacionais', sub: 'Fazer mais com a mesma equipe, cortando desperdício.', score: 95 },
      { icon: 'trending-up', label: 'Escalar o faturamento', sub: 'Preparar a base tecnológica para crescer 2x ou mais.', score: 88 }
    ]
  },
  {
    id: 'faturamento',
    label: 'PASSO 05 / 06',
    title: 'Qual a faixa de faturamento mensal da empresa?',
    desc: 'Isso determina o tipo de tecnologia que vamos recomendar e o custo do desperdício.',
    type: 'options',
    options: [
      { icon: 'wallet', label: 'Até R$ 50 mil/mês', sub: 'Operação inicial', score: 70 },
      { icon: 'briefcase', label: 'R$ 50k a R$ 200 mil/mês', sub: 'Ganhando tração', score: 85 },
      { icon: 'landmark', label: 'R$ 200k a R$ 500 mil/mês', sub: 'Operação consolidada', score: 92 },
      { icon: 'gem', label: 'Acima de R$ 500 mil/mês', sub: 'Grande volume de dados', score: 96 }
    ]
  },
  {
    id: 'contato',
    label: 'PASSO 06 / 06',
    title: 'Para onde enviamos a análise final?',
    desc: 'Seu diagnóstico analítico está quase pronto.',
    type: 'text',
    fields: [
      { id: 'nome', placeholder: 'Seu Nome e Cargo', type: 'text', required: true },
      { id: 'empresa', placeholder: 'Nome da Empresa', type: 'text', required: true },
      { id: 'whatsapp', placeholder: 'WhatsApp (com DDD)', type: 'tel', required: true }
    ]
  }
];

const LOADING_STEPS = [
  { icon: 'map-pin', text: 'Mapeando concorrência local...' },
  { icon: 'activity', text: 'Cruzando dados de ineficiência operacional...' },
  { icon: 'calculator', text: 'Calculando estimativa de perda financeira...' },
  { icon: 'file-check-2', text: 'Gerando dashboard de risco...' }
];

let currentStep = 0;
let answers = {};
let textValues = {};

function openDiagnostic() {
  currentStep = 0;
  answers = {};
  textValues = {};
  document.getElementById('diagnostic-overlay').classList.add('open');
  document.body.classList.add('modal-open');
  renderDiagnosticStep();
}

function closeDiagnostic() {
  document.getElementById('diagnostic-overlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function renderDiagnosticStep() {
  var q = QUESTIONS[currentStep];
  var content = document.getElementById('diagnostic-content');
  var progressFill = document.getElementById('diagnostic-progress-fill');
  progressFill.style.width = ((currentStep) / QUESTIONS.length * 100) + '%';

  if (q.type === 'options') {
    content.innerHTML =
      '<div class="diag-question-wrap reveal visible">' +
      '<p class="diag-step-label">' + q.label + '</p>' +
      '<h2 class="diag-title">' + q.title + '</h2>' +
      '<p class="diag-desc">' + q.desc + '</p>' +
      '<div class="diag-options">' +
      q.options.map(function (opt, i) {
        return '<div class="diag-option ' + (answers[q.id] === i ? 'selected' : '') + '" onclick="selectDiagOption(' + i + ')">' +
          '<div class="diag-option-icon"><i data-lucide="' + opt.icon + '"></i></div>' +
          '<div class="diag-option-info">' +
          '<div class="diag-option-label">' + opt.label + '</div>' +
          '<div class="diag-option-sub">' + opt.sub + '</div>' +
          '</div>' +
          '<div class="diag-option-check">' + (answers[q.id] === i ? '<i data-lucide="check" width="16"></i>' : '') + '</div>' +
          '</div>';
      }).join('') +
      '</div></div>';

    if (currentStep > 0) {
      content.querySelector('.diag-question-wrap').insertAdjacentHTML('beforeend', '<button type="button" class="diag-back" onclick="prevDiagStep()" style="margin-top:24px"><i data-lucide="arrow-left" width="16" style="margin-right:8px"></i> Voltar</button>');
    }
  } else {
    content.innerHTML =
      '<div class="diag-question-wrap reveal visible">' +
      '<p class="diag-step-label">' + q.label + '</p>' +
      '<h2 class="diag-title">' + q.title + '</h2>' +
      '<p class="diag-desc">' + q.desc + '</p>' +
      '<div class="diag-fields">' +
      q.fields.map(function (f) {
        return '<div class="diag-field-wrap">' +
          '<input class="diag-input" id="diag-field-' + f.id + '" type="' + f.type + '" placeholder="' + f.placeholder + '" value="' + escapeHtml(textValues[f.id] || '') + '" oninput="clearDiagError(\'' + f.id + '\')">' +
          '<div class="diag-field-error" id="diag-error-' + f.id + '">Preenchimento obrigatório</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div class="diag-nav">' +
      '<button type="button" class="diag-back" onclick="prevDiagStep()"><i data-lucide="arrow-left" width="16" style="margin-right:8px"></i> Voltar</button>' +
      '<button type="button" class="btn-primary" onclick="nextDiagStep()">Liberar Diagnóstico <i data-lucide="arrow-right" width="16" style="margin-left:8px"></i></button>' +
      '</div></div>';
  }
  lucide.createIcons();
}

function selectDiagOption(i) {
  answers[QUESTIONS[currentStep].id] = i;
  if (currentStep < QUESTIONS.length - 1) {
    setTimeout(function () { currentStep++; renderDiagnosticStep(); }, 250);
  } else {
    setTimeout(runDiagLoading, 250);
  }
}

function nextDiagStep() {
  var q = QUESTIONS[currentStep];
  if (q.type === 'text') {
    var hasError = false;
    q.fields.forEach(function (f) {
      var inputEl = document.getElementById('diag-field-' + f.id);
      if (f.required && !inputEl.value.trim()) {
        hasError = true;
        document.getElementById('diag-error-' + f.id).style.display = 'block';
        inputEl.classList.add('input-error');
      }
      textValues[f.id] = inputEl.value.trim();
    });
    if (hasError) return;
  }
  if (currentStep === QUESTIONS.length - 1) {
      runDiagLoading();
  } else {
      currentStep++;
      renderDiagnosticStep();
  }
}

function prevDiagStep() { currentStep--; renderDiagnosticStep(); }
function clearDiagError(fid) {
  document.getElementById('diag-error-' + fid).style.display = 'none';
  document.getElementById('diag-field-' + fid).classList.remove('input-error');
}

function runDiagLoading() {
  document.getElementById('diagnostic-progress-fill').style.width = '100%';
  var content = document.getElementById('diagnostic-content');
  
  content.innerHTML =
    '<div class="diag-loading reveal visible">' +
    '<div class="diag-loading-ring"></div>' +
    '<h2 class="diag-loading-title">Analisando inteligência competitiva...</h2>' +
    '<div class="diag-loading-steps">' +
    LOADING_STEPS.map(function (s, i) {
      return '<div class="diag-loading-step" id="dls-' + i + '">' +
        '<div class="diag-loading-step-icon"><i data-lucide="' + s.icon + '" width="14"></i></div>' +
        '<span>' + s.text + '</span>' +
        '</div>';
    }).join('') +
    '</div></div>';
  
  lucide.createIcons();

  var i = 0;
  var tick = function () {
    if (i > 0) {
      var prev = document.getElementById('dls-' + (i - 1));
      prev.classList.add('done');
      prev.querySelector('.diag-loading-step-icon').innerHTML = '<i data-lucide="check" width="14"></i>';
    }
    if (i < LOADING_STEPS.length) {
      document.getElementById('dls-' + i).classList.add('active');
      lucide.createIcons();
      i++;
      setTimeout(tick, 800);
    } else {
      setTimeout(showDiagResult, 600);
    }
  };
  tick();
}

function showDiagResult() {
  var content = document.getElementById('diagnostic-content');
  var nomeFull = textValues.nome || 'Gestor';
  var nomeFirst = nomeFull.split(' ')[0];
  var empresa = textValues.empresa || 'sua empresa';
  
  // LOGICA FINANCEIRA E CONTEXTUAL (Gerador de Dor)
  var gargaloIndex = answers['gargalo']; 
  var faturamentoIndex = answers['faturamento']; 
  
  // Estimativa de perda financeira (calculada com base na faixa de faturamento - ~8% a 15% de perda operacional em médias de mercado)
  var perdaEstimada = "R$ 4.500";
  if(faturamentoIndex === 1) perdaEstimada = "R$ 14.800";
  if(faturamentoIndex === 2) perdaEstimada = "R$ 38.500";
  if(faturamentoIndex === 3) perdaEstimada = "R$ 80.000+";

  var tituloProblema = QUESTIONS[0].options[gargaloIndex].label;

  content.innerHTML =
    '<div class="diag-result reveal visible">' +
    '<div class="diag-result-header">' +
    '<h2 class="diag-result-title">' + escapeHtml(nomeFirst) + ', a realidade da sua operação:</h2>' +
    '<p class="diag-desc">Com base nas suas respostas, a falta de automação está criando uma desvantagem competitiva severa para a ' + escapeHtml(empresa) + ' frente ao mercado de <strong>' + escapeHtml(leadLocation) + '</strong>.</p>' +
    '</div>' +
    
    '<div class="diag-dashboard">' +
       // WIDGET 1: GRÁFICO DE CONCORRÊNCIA
       '<div class="diag-widget warning">' +
          '<div class="widget-header"><i data-lucide="bar-chart-2" style="color:var(--blue)"></i> <span class="widget-title">Análise de Eficiência Competitiva</span></div>' +
          '<p style="font-size:14px; color:rgba(255,255,255,0.7); margin-bottom: 20px;">Velocidade de execução em tarefas de ' + tituloProblema.toLowerCase() + ' comparado com o top 20% das empresas da sua região.</p>' +
          '<div class="css-chart">' +
             '<div class="chart-row">' +
                '<div class="chart-label"><span>Sua Operação (' + escapeHtml(empresa) + ')</span> <span style="color:#EF4444; font-weight:bold;">Lenta</span></div>' +
                '<div class="chart-bar-bg"><div class="chart-bar-fill bad" id="anim-bar-1"></div></div>' +
             '</div>' +
             '<div class="chart-row">' +
                '<div class="chart-label"><span>Concorrentes Automatizados</span> <span style="color:var(--blue); font-weight:bold;">Alta</span></div>' +
                '<div class="chart-bar-bg"><div class="chart-bar-fill good" id="anim-bar-2"></div></div>' +
             '</div>' +
          '</div>' +
       '</div>' +

       // WIDGET 2: SANGRIA FINANCEIRA
       '<div class="diag-widget danger">' +
          '<div class="widget-header"><i data-lucide="alert-triangle" style="color:#EF4444"></i> <span class="widget-title">Estimativa de Desperdício Mensal</span></div>' +
          '<p style="font-size:14px; color:rgba(255,255,255,0.7);">Valor estimado que está sendo "deixado na mesa" devido a falhas humanas, retrabalho e sistemas não integrados:</p>' +
          '<div class="financial-bleed">Até ' + perdaEstimada + '</div>' +
          '<div class="financial-sub">por mês, direto da margem de lucro.</div>' +
       '</div>' +
    '</div>' + // end dashboard
    
    '<div class="diag-result-cta">' +
    '<h3>Nós sabemos como resolver isso.</h3>' +
    '<p>A BG Tech implementa a mesma arquitetura tecnológica que os líderes de mercado utilizam, em até 7 dias.</p>' +
    '<button class="btn-primary" style="display:inline-flex;align-items:center;gap:8px;" onclick="sendPayload()"><i data-lucide="calendar" width="18"></i> Desenhar Arquitetura de Solução</button>' +
    '</div></div>';
    
  lucide.createIcons();

  // Aciona a animação do gráfico de barras com um pequeno delay
  setTimeout(() => {
     document.getElementById('anim-bar-1').style.width = '85%';
     document.getElementById('anim-bar-2').style.width = '20%';
  }, 100);
}

function sendPayload() {
  if (CONFIG.webhookUrl) {
    let payloadRespostas = {};
    for (const key in answers) {
       const question = QUESTIONS.find(q => q.id === key);
       if (question) payloadRespostas[key] = question.options[answers[key]].label;
    }

    fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          nome: textValues.nome, 
          empresa: textValues.empresa, 
          telefone: textValues.whatsapp, 
          localizacao_estimada: leadLocation,
          respostas: payloadRespostas 
      })
    }).then(() => {
        // Redireciona pro WhatsApp após disparar o webhook
        var wppUrl = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent('Olá, sou ' + textValues.nome + ' da ' + textValues.empresa + '. Concluí o diagnóstico da BG Tech e me assustei com o volume de ineficiência. Quero desenhar uma arquitetura para resolver meu problema de ' + payloadRespostas['gargalo'] + '.');
        window.open(wppUrl, '_blank');
    }).catch(e => console.error('Erro no envio do Webhook', e));
  } else {
     // Fallback caso não tenha webhook configurado ainda
     var wppUrl = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent('Olá, quero agendar uma avaliação da arquitetura de tecnologia da minha empresa.');
     window.open(wppUrl, '_blank');
  }
}
