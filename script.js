// ==== CONFIGURAÇÕES ====
const CONFIG = {
  whatsappNumber: '5511999998888',
  webhookUrl: '' // Insira sua URL do Make.com aqui
};

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

const urlParams = new URLSearchParams(window.location.search);
const UTM = {
  source: urlParams.get('utm_source') || '',
  medium: urlParams.get('utm_medium') || '',
  campaign: urlParams.get('utm_campaign') || ''
};

// ==== INTERAÇÕES DE UI ====
(function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    bar.style.width = (pct * 100) + '%';
    bar.classList.toggle('visible', window.scrollY > 100);
  }, { passive: true });
})();

(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

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

(function initCounters() {
  var counters = document.querySelectorAll('.counter[data-target]');
  if (!counters.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      var target = parseFloat(el.dataset.target);
      var decimals = parseInt(el.dataset.decimals, 10) || 0;
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      var duration = 1800;
      var start = performance.now();
      function update(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3);
        var current = target * ease;
        el.textContent = prefix + current.toFixed(decimals) + suffix;
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        }
      }
      requestAnimationFrame(update);
    });
  }, { threshold: 0.5 });
  counters.forEach(function (el) { observer.observe(el); });
})();

function toggleFaq(btn) {
  var item = btn.closest('.faq-item');
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function (el) { el.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

// ==== QUIZ E DIAGNÓSTICO ====
const QUESTIONS = [
  {
    id: 'contato',
    label: 'PASSO 01 / 06',
    title: 'Como podemos te chamar?',
    desc: 'Para uma experiência personalizada, informe seu nome e como podemos entrar em contato com você.',
    type: 'text',
    fields: [
      { id: 'nome', placeholder: 'Seu nome completo', type: 'text', required: true },
      { id: 'empresa', placeholder: 'Nome da empresa (opcional)', type: 'text', required: false },
      { id: 'whatsapp', placeholder: 'WhatsApp (com DDD)', type: 'tel', required: true }
    ]
  },
  {
    id: 'setor',
    label: 'PASSO 02 / 06',
    title: 'Qual o segmento da sua empresa?',
    desc: 'Cada setor tem padrões de ineficiência únicos.',
    type: 'options',
    options: [
      { icon: '🛒', label: 'Comércio e Varejo', sub: 'Loja física, e-commerce, distribuidoras', score: 82 },
      { icon: '🏭', label: 'Indústria e Manufatura', sub: 'Produção, logística, fornecedores', score: 88 },
      { icon: '🏥', label: 'Saúde e Bem-estar', sub: 'Clínicas, consultórios, farmácias', score: 91 },
      { icon: '🏢', label: 'Serviços Profissionais', sub: 'Contabilidade, advocacia, consultoria', score: 79 },
      { icon: '🍽️', label: 'Alimentação', sub: 'Restaurantes, hotéis', score: 85 },
      { icon: '📦', label: 'Outro segmento', sub: 'Me conta mais no próximo passo', score: 80 }
    ]
  },
  {
    id: 'tamanho',
    label: 'PASSO 03 / 06',
    title: 'Quantas pessoas trabalham na sua empresa?',
    desc: 'O tamanho da equipe muda o tipo de solução ideal.',
    type: 'options',
    options: [
      { icon: '👤', label: 'Só eu', sub: 'Faço tudo sozinho', score: 70 },
      { icon: '👥', label: '2 a 10 pessoas', sub: 'Pequena equipe', score: 85 },
      { icon: '🏃', label: '11 a 30 pessoas', sub: 'Crescendo', score: 92 },
      { icon: '🏢', label: '31 a 100 pessoas', sub: 'Gestão mais complexa', score: 95 },
      { icon: '🏭', label: 'Mais de 100 pessoas', sub: 'Estrutura corporativa', score: 90 }
    ]
  },
  {
    id: 'dor',
    label: 'PASSO 04 / 06',
    title: 'Qual dor tira mais o seu sono hoje?',
    desc: 'Seja honesto. A resposta certa é a que você sente na prática todo dia.',
    type: 'options',
    options: [
      { icon: '⏰', label: 'Perco tempo com tarefas repetitivas', sub: 'Planilhas manuais', score: 88 },
      { icon: '📉', label: 'Minha equipe não é produtiva o suficiente', sub: 'Muito esforço, pouco resultado', score: 82 },
      { icon: '❌', label: 'Muitos erros humanos me custam caro', sub: 'Falhas que poderiam ser evitadas', score: 91 },
      { icon: '🔌', label: 'Meus sistemas não se comunicam', sub: 'Dados duplicados', score: 94 },
      { icon: '💰', label: 'Não consigo prever minha receita', sub: 'Falta de visibilidade', score: 86 },
      { icon: '🚪', label: 'Perco clientes por atendimento lento', sub: 'Lead esfria', score: 89 }
    ]
  },
  {
    id: 'faturamento',
    label: 'PASSO 05 / 06',
    title: 'Qual a faixa de faturamento mensal?',
    desc: 'Quanto maior o faturamento, maiores os ganhos potenciais.',
    type: 'options',
    options: [
      { icon: '🌱', label: 'Até R$ 30 mil/mês', sub: 'Fase de validação', score: 75 },
      { icon: '🌿', label: 'R$ 30 mil a R$ 100 mil/mês', sub: 'Crescimento acelerado', score: 88 },
      { icon: '🌳', label: 'R$ 100 mil a R$ 500 mil/mês', sub: 'Empresa consolidada', score: 93 },
      { icon: '🏦', label: 'Acima de R$ 500 mil/mês', sub: 'Grande empresa', score: 96 },
      { icon: '🔒', label: 'Prefiro não informar', sub: 'Tudo bem', score: 80 }
    ]
  },
  {
    id: 'tecnologia',
    label: 'PASSO 06 / 06',
    title: 'Como está a tecnologia na sua empresa?',
    desc: 'Última etapa! Assim finalizamos o mapeamento.',
    type: 'options',
    options: [
      { icon: '📋', label: 'Planilhas e papel', sub: 'Muito a evoluir', score: 95 },
      { icon: '🖥️', label: 'Sistemas desconectados', sub: 'O caos da falta de integração', score: 91 },
      { icon: '⚡', label: 'Sistemas subutilizados', sub: 'Pagamos por algo que não exploramos', score: 85 },
      { icon: '🔧', label: 'Razoável, mas precisa melhorar', sub: 'Base sólida para evoluir', score: 80 },
      { icon: '🚀', label: 'Nossa tecnologia é forte', sub: 'Podemos ir mais longe', score: 72 }
    ]
  }
];

const LOADING_STEPS = [
  { icon: '🔎', text: 'Mapeando o perfil do seu negócio' },
  { icon: '🚧', text: 'Identificando os gargalos operacionais' },
  { icon: '💸', text: 'Calculando o impacto financeiro' },
  { icon: '🎯', text: 'Priorizando ações de maior retorno' },
  { icon: '🎁', text: 'Preparando seu diagnóstico personalizado' }
];

let currentStep = 0;
let answers = {};
let textValues = {};

function openDiagnostic() {
  currentStep = 0;
  answers = {};
  textValues = {};
  var overlay = document.getElementById('diagnostic-overlay');
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
  renderDiagnosticStep();
  updateDiagnosticProgress();
}

function closeDiagnostic() {
  document.getElementById('diagnostic-overlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function renderDots() {
  var dotsEl = document.getElementById('diagnostic-dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = QUESTIONS.map(function (_, i) {
    var cls = 'dot';
    if (i < currentStep) cls += ' done';
    if (i === currentStep) cls += ' active';
    return '<span class="' + cls + '"></span>';
  }).join('');
}

function renderDiagnosticStep() {
  renderDots();
  var q = QUESTIONS[currentStep];
  var content = document.getElementById('diagnostic-content');

  if (q.type === 'options') {
    content.innerHTML =
      '<div class="diag-question-wrap">' +
      '<p class="diag-step-label">' + q.label + '</p>' +
      '<h2 class="diag-title">' + q.title + '</h2>' +
      '<p class="diag-desc">' + q.desc + '</p>' +
      '<div class="diag-options">' +
      q.options.map(function (opt, i) {
        return '<div class="diag-option ' + (answers[q.id] === i ? 'selected' : '') + '" onclick="selectDiagOption(' + i + ')">' +
          '<div class="diag-option-icon">' + opt.icon + '</div>' +
          '<div class="diag-option-info">' +
          '<div class="diag-option-label">' + opt.label + '</div>' +
          '<div class="diag-option-sub">' + opt.sub + '</div>' +
          '</div>' +
          '<div class="diag-option-check">' + (answers[q.id] === i ? '✔' : '') + '</div>' +
          '</div>';
      }).join('') +
      '</div></div>';

    if (currentStep > 0) {
      var wrap = content.querySelector('.diag-question-wrap');
      wrap.insertAdjacentHTML('beforeend', '<button type="button" class="diag-back" onclick="prevDiagStep()" style="margin-top:24px">← Voltar</button>');
    }
  } else {
    var autocompleteMap = { nome: 'name', empresa: 'organization', whatsapp: 'tel' };
    content.innerHTML =
      '<div class="diag-question-wrap">' +
      '<p class="diag-step-label">' + q.label + '</p>' +
      '<h2 class="diag-title">' + q.title + '</h2>' +
      '<p class="diag-desc">' + q.desc + '</p>' +
      '<div class="diag-fields">' +
      q.fields.map(function (f) {
        return '<div class="diag-field-wrap">' +
          '<input class="diag-input" id="diag-field-' + f.id + '" type="' + f.type + '" placeholder="' + f.placeholder + '" value="' + escapeHtml(textValues[f.id] || '') + '" oninput="clearDiagError(\'' + f.id + '\')" autocomplete="' + (autocompleteMap[f.id] || 'off') + '">' +
          '<div class="diag-field-error" id="diag-error-' + f.id + '">Campo obrigatório</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div class="diag-nav">' +
      (currentStep > 0 ? '<button type="button" class="diag-back" onclick="prevDiagStep()">← Voltar</button>' : '<span></span>') +
      '<button type="button" class="btn-primary" onclick="nextDiagStep()">Ver Diagnóstico</button>' +
      '</div></div>';
  }
}

function selectDiagOption(i) {
  var q = QUESTIONS[currentStep];
  answers[q.id] = i;
  if (currentStep < QUESTIONS.length - 1) {
    setTimeout(function () {
      currentStep++;
      renderDiagnosticStep();
      updateDiagnosticProgress();
    }, 380);
  } else {
    setTimeout(runDiagLoading, 380);
  }
}

function nextDiagStep() {
  var q = QUESTIONS[currentStep];
  if (q.type === 'text') {
    var hasError = false;
    q.fields.forEach(function (f) {
      if (f.required) {
        var inputEl = document.getElementById('diag-field-' + f.id);
        var val = inputEl ? inputEl.value.trim() : '';
        if (!val) {
          hasError = true;
          var errEl = document.getElementById('diag-error-' + f.id);
          if (errEl) errEl.style.display = 'block';
          if (inputEl) inputEl.classList.add('input-error');
        }
      }
    });
    if (hasError) return;
    q.fields.forEach(function (f) {
      var inputEl = document.getElementById('diag-field-' + f.id);
      textValues[f.id] = inputEl ? inputEl.value.trim() : '';
    });
    answers[q.id] = textValues;
  }
  if (currentStep < QUESTIONS.length - 1) {
    currentStep++;
    renderDiagnosticStep();
    updateDiagnosticProgress();
  } else {
    runDiagLoading();
  }
}

function prevDiagStep() {
  if (currentStep > 0) {
    currentStep--;
    renderDiagnosticStep();
    updateDiagnosticProgress();
  }
}

function clearDiagError(fid) {
  var errEl = document.getElementById('diag-error-' + fid);
  var inputEl = document.getElementById('diag-field-' + fid);
  if (errEl) errEl.style.display = 'none';
  if (inputEl) inputEl.classList.remove('input-error');
}

function updateDiagnosticProgress() {
  var pct = ((currentStep + 1) / QUESTIONS.length) * 100;
  var fill = document.getElementById('diagnostic-progress-fill');
  if (fill) fill.style.width = pct + '%';
}

function runDiagLoading() {
  var content = document.getElementById('diagnostic-content');
  content.innerHTML =
    '<div class="diag-loading">' +
    '<div class="diag-loading-ring"></div>' +
    '<h2 class="diag-loading-title">Analisando seu negócio...</h2>' +
    '<div class="diag-loading-steps" id="diag-loading-steps">' +
    LOADING_STEPS.map(function (s, i) {
      return '<div class="diag-loading-step" id="dls-' + i + '">' +
        '<div class="diag-loading-step-icon">' + s.icon + '</div>' +
        '<span>' + s.text + '</span>' +
        '</div>';
    }).join('') +
    '</div></div>';

  var i = 0;
  var tick = function () {
    if (i > 0) {
      var prev = document.getElementById('dls-' + (i - 1));
      if (prev) {
        prev.classList.remove('active');
        prev.classList.add('done');
        prev.querySelector('.diag-loading-step-icon').textContent = '✔';
      }
    }
    if (i < LOADING_STEPS.length) {
      var el = document.getElementById('dls-' + i);
      if (el) el.classList.add('active');
      i++;
      setTimeout(tick, 700);
    } else {
      setTimeout(showDiagResult, 600);
    }
  };
  setTimeout(tick, 300);
}

function showDiagResult() {
  var total = 0, weightSum = 0;
  var weights = { setor: 1, tamanho: 1.3, dor: 1.5, faturamento: 1.4, tecnologia: 1.2 };
  QUESTIONS.slice(0, 5).forEach(function (q) {
    var idx = answers[q.id];
    if (typeof idx === 'number') {
      var w = weights[q.id] || 1;
      total += q.options[idx].score * w;
      weightSum += w;
    }
  });
  var score = weightSum > 0 ? Math.min(99, Math.max(55, Math.round(total / weightSum))) : 75;

  var nome = escapeHtml(textValues.nome ? textValues.nome.split(' ')[0] : 'Empresário');
  var empresa = escapeHtml(textValues.empresa || 'sua empresa');
  var dorIdx = answers['dor'];

  var profile, scoreDesc, scoreText;
  if (score >= 90) {
    profile = 'crítico';
    scoreDesc = 'Urgente: Você Está Perdendo Dinheiro Agora';
    scoreText = 'A ' + empresa + ' tem um volume alto de dinheiro sendo desperdiçado em processos. Cada mês sem ação tem um custo real.';
  } else if (score >= 80) {
    profile = 'alto';
    scoreDesc = 'Alto Potencial: Hora de Agir';
    scoreText = 'A ' + empresa + ' está num ponto ideal para dar o próximo salto de crescimento e lucro.';
  } else {
    profile = 'bom';
    scoreDesc = 'Boas Oportunidades à Vista';
    scoreText = 'A ' + empresa + ' já tem uma base boa. O trabalho agora é encontrar os pontos exatos de melhoria.';
  }

  var insights = [
    { icon: '⚠️', label: 'PRINCIPAL GARGALO', title: dorIdx !== undefined ? QUESTIONS[3].options[dorIdx].label : 'Processos manuais', text: 'É aqui que a sua equipe perde mais tempo e energia.' },
    { icon: '💸', label: 'IMPACTO FINANCEIRO', title: score >= 90 ? 'Perda mensal acima de R$ 15.000' : 'Perda entre R$ 5k e 15k', text: 'Estimativa baseada em empresas parecidas com a sua.' },
    { icon: '🚨', label: 'PRIORIDADE DE AÇÃO', title: score >= 90 ? 'Urgente: Aja em 30 dias' : 'Alta: Janela aberta', text: 'Empresas parecidas que tomaram ação estão operando com muito menos custo.' },
    { icon: '⏱️', label: 'TEMPO PARA ROI', title: 'Resultado em 4 a 8 semanas', text: 'Você vai sentir a diferença operacional rápido.' }
  ];

  var opps = [
    { icon: '⚡', name: 'Automação de processos', pct: 94 },
    { icon: '💬', name: 'Atendimento de leads', pct: 87 },
    { icon: '📊', name: 'Visibilidade de dados', pct: 78 },
    { icon: '🔗', name: 'Integração de sistemas', pct: 65 },
    { icon: '🌐', name: 'Presença digital', pct: 52 }
  ];

  var shareTxt = 'Olá! Fiz o diagnóstico na BG Tech e meu score de automação é ' + score + '%. Gostaria de falar com um especialista.';
  var wppUrl = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(shareTxt);

  var content = document.getElementById('diagnostic-content');
  content.innerHTML =
    '<div class="diag-result">' +
    '<div class="diag-result-header">' +
    '<h2 class="diag-result-title">' + nome + ', seu diagnóstico está pronto.</h2>' +
    '</div>' +
    '<div class="diag-score-banner">' +
    '<div class="diag-score-info">' +
    '<div class="diag-score-label">' + scoreDesc + ' (' + score + '/100)</div>' +
    '<p class="diag-score-text">' + scoreText + '</p>' +
    '</div></div>' +
    '<div class="diag-insights">' +
    insights.map(function (ins) {
      return '<div class="diag-insight-card">' +
        '<div class="diag-insight-icon">' + ins.icon + '</div>' +
        '<div class="diag-insight-label">' + ins.label + '</div>' +
        '<div class="diag-insight-title">' + ins.title + '</div>' +
        '<div class="diag-insight-text">' + ins.text + '</div></div>';
    }).join('') +
    '</div>' +
    '<div class="diag-result-cta">' +
    '<h3>' + nome + ', vamos resolver isso juntos.</h3>' +
    '<p>Um especialista entra em contato em até 24h úteis.</p>' +
    '<a href="' + wppUrl + '" target="_blank" class="btn-primary" onclick="sendPayload(' + score + ', \'' + profile + '\')">📱 Falar pelo WhatsApp</a>' +
    '</div></div>';
}

function sendPayload(score, profile) {
  // Lógica de envio de Webhook (Make/Zapier) e Analytics.
}

// ==== CANVAS BACKGROUND ====
(function () {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d'), hero = document.getElementById('hero');
  var mouse = { x: null, y: null }, pts = [], raf;
  function resize() { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; }
  function seed() {
    pts = [];
    var n = Math.min(100, Math.floor(canvas.width * canvas.height / 9500));
    for (var i = 0; i < n; i++) pts.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .42, vy: (Math.random() - .5) * .42,
      r: Math.random() * 1.6 + .7, o: Math.random() * .38 + .1
    });
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14,165,233,' + p.o + ')'; ctx.fill();
    });
    raf = requestAnimationFrame(tick);
  }
  resize(); seed(); tick();
  window.addEventListener('resize', function () { cancelAnimationFrame(raf); resize(); seed(); tick(); });
})();

// ==== TERMOS E POLÍTICA DE PRIVACIDADE ====
var LEGAL_CONTENT = {
  privacy: {
    title: 'Política de Privacidade',
    body: '<p style="color:#fff">Última atualização: Fevereiro de 2026</p><p style="color:#fff">A BG Tech está comprometida com a proteção dos seus dados de acordo com a LGPD.</p>'
  },
  terms: {
    title: 'Termos de Uso',
    body: '<p style="color:#fff">Ao utilizar o site da BG Tech, você concorda com os presentes Termos de Uso.</p>'
  }
};

function openLegalModal(type) {
  var data = LEGAL_CONTENT[type];
  if (!data) return;
  var modal = document.getElementById('legal-modal');
  var modalContent = document.getElementById('legal-modal-content');
  if (!modal || !modalContent) return;
  modalContent.innerHTML = '<h2 style="color:#fff;margin-bottom:20px">' + data.title + '</h2>' + data.body;
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
}

function closeLegalModal() {
  var modal = document.getElementById('legal-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

function cookieAccept() { document.getElementById('cookie-banner').style.display = 'none'; }
function cookieDecline() { document.getElementById('cookie-banner').style.display = 'none'; }
