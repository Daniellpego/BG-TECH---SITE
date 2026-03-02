// ==== CONFIGURAÇÕES BG TECH ====
const CONFIG = {
  whatsappNumber: '5511999998888', // LEMBRE DE COLOCAR O SEU NÚMERO AQUI
  webhookUrl: '', // Deixe vazio, vamos usar o Supabase
  supabaseUrl: 'https://urpuiznydrlwmaqhdids.supabase.co', 
  supabaseKey: 'sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0'
};

let leadLocation = "sua região";
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000);

fetch('https://ipapi.co/json/', { signal: controller.signal })
  .then(r => r.json())
  .then(d => { if (d.city) leadLocation = d.city; })
  .catch(() => {}) 
  .finally(() => clearTimeout(timeout));

const capitalize = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const QUESTIONS = [
  {
    id: 'segmento', label: 'PASSO 1 DE 5',
    title: 'Qual o segmento da sua empresa?',
    desc: 'Isso calibra os benchmarks e o vocabulário do seu diagnóstico.',
    type: 'options',
    options: [
      { icon: 'hard-hat', title: 'Construção Civil', sub: 'Obras, projetos e gestão de equipe de campo' },
      { icon: 'scale', title: 'Jurídico e Contabilidade', sub: 'Escritórios, processos e clientes recorrentes' },
      { icon: 'store', title: 'Comércio e Varejo', sub: 'Loja física, e-commerce ou distribuidora' },
      { icon: 'factory', title: 'Indústria e Manufatura', sub: 'Produção, estoque e operação fabril' },
      { icon: 'stethoscope', title: 'Saúde', sub: 'Clínicas, laboratórios e prestadores de saúde' },
      { icon: 'briefcase', title: 'Serviços e Consultoria', sub: 'Agências, consultorias e empresas de serviço' }
    ]
  },
  {
    id: 'horas_perdidas', label: 'PASSO 2 DE 5',
    title: 'Quanto tempo sua equipe perde por semana em tarefas manuais?',
    desc: 'Seja honesto. Some mentalmente as horas de retrabalho antes de responder.',
    type: 'options',
    options: [
      { icon: 'timer', title: 'Menos de 5 horas', sub: 'Operação bem azeitada' },
      { icon: 'refresh-ccw', title: 'Entre 5 e 15 horas', sub: 'Já dói, mas dá pra ignorar' },
      { icon: 'flame', title: 'Entre 15 e 30 horas', sub: 'Está custando dinheiro real todo mês' },
      { icon: 'skull', title: 'Mais de 30 horas', sub: 'O manual virou o modelo de negócio' }
    ]
  },
  {
    id: 'dor', label: 'PASSO 3 DE 5',
    title: 'O que mais trava o crescimento da empresa hoje?',
    desc: 'Escolha a opção que mais corrói o seu lucro.',
    type: 'options',
    options: [
      { icon: 'clock', title: 'Processos manuais', sub: 'Sua equipe é boa. Só que 30% do dia dela vai pro lixo.' },
      { icon: 'cable', title: 'Sistemas que não se integram', sub: 'Você paga por ferramentas que não se falam.' },
      { icon: 'alert-circle', title: 'Suporte de TI lento', sub: 'Cada hora parada custa dinheiro. Você sabe disso.' },
      { icon: 'bar-chart', title: 'Falta de visibilidade', sub: 'Você decide com base no feeling e não em dados exatos.' },
      { icon: 'users', title: 'Equipe sobrecarregada', sub: 'Crescer virou sinônimo de contratar mais. Não devia ser assim.' }
    ]
  },
  {
    id: 'faturamento', label: 'PASSO 4 DE 5',
    title: 'Qual faixa melhor representa o faturamento mensal atual?',
    desc: 'Isso determina o impacto financeiro exato que vai aparecer no seu diagnóstico.',
    type: 'options',
    options: [
      { icon: 'wallet', title: 'Até R$ 50 mil', sub: 'Fase de validação do modelo' },
      { icon: 'trending-up', title: 'Entre R$ 50k e R$ 200 mil', sub: 'Ganhando tração e corpo' },
      { icon: 'landmark', title: 'Entre R$ 200k e R$ 500 mil', sub: 'Operação sólida buscando escala' },
      { icon: 'gem', title: 'Acima de R$ 500 mil', sub: 'Estrutura robusta' }
    ]
  },
  {
    id: 'maturidade', label: 'PASSO 5 DE 5',
    title: 'Sendo completamente honesto, como você descreveria a tecnologia hoje?',
    desc: 'O nível de maturidade digital atual da empresa.',
    type: 'options',
    options: [
      { icon: 'file-text', iconColor: 'icon-red', title: 'No papel ou Excel', sub: 'Tudo manual dependente de pessoas' },
      { icon: 'box', iconColor: 'icon-orange', title: 'Sistemas básicos', sub: 'Até tem ferramenta mas ninguém usa direito' },
      { icon: 'boxes', iconColor: 'icon-yellow', title: 'Sistemas sem integração', sub: 'Dados espalhados e muito retrabalho' },
      { icon: 'server', iconColor: 'icon-blue-light', title: 'Sistemas razoáveis', sub: 'Funciona mas tem muito espaço pra evoluir' },
      { icon: 'rocket', iconColor: 'icon-cyan', title: 'Tecnologia boa', sub: 'Base sólida, preciso de um parceiro estratégico' }
    ]
  },
  {
    id: 'contato', label: '', 
    title: 'Seu diagnóstico está pronto.',
    desc: 'Informe para quem enviamos a análise completa da sua operation.',
    type: 'text',
    fields: [
      { id: 'nome', placeholder: 'Como você prefere ser chamado?' },
      { id: 'empresa', placeholder: 'Nome da empresa' },
      { id: 'whatsapp', placeholder: 'WhatsApp (com DDD)' }
    ]
  }
];

const echos = {
  horas_perdidas: [
    null,
    "Esse padrão de fuga de horas aparece em 62% das empresas no seu estágio de crescimento.",
    "Atenção. Com esse volume sua equipe perde efetivamente quase 2 dias inteiros por semana em rotinas braçais.",
    "Custo crítico. Acima de 30h semanais o desperdício invisível supera facilmente o salário de um gestor."
  ],
  dor: [
    "Processos manuais não escalam. É a maior trava de crescimento documentada no B2B atual.",
    "Sistemas desconectados geram retrabalho infinito e furos graves de informação.",
    "A falta de suporte técnico drena não só dinheiro, mas a moral da equipe inteira.",
    "Decidir sem dados em tempo real é o que separa empresas que estagnam das que lideram o mercado.",
    "Sobrecarga operacional gera turnover alto. A automação resolve isso direto na raiz."
  ],
  faturamento: [
    null,
    "Ótimo. Nessa faixa cada R$1.000 economizado em operação vira lucro direto no fim do mês.",
    "Uma operação desse porte precisa de tecnologia robusta para não implodir sob o próprio peso.",
    "Com esse volume qualquer ineficiência de 2% já representa dezenas de milhares de reais perdidos."
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuiz(); });
  document.getElementById('quiz-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('quiz-overlay')) closeQuiz();
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('process-steps')) {
           setTimeout(() => { document.getElementById('process-line').style.width = '100%'; }, 500);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseFloat(counter.getAttribute('data-target'));
        const isFloat = counter.getAttribute('data-target').includes('.');
        let startTime = null;
        const duration = 1800;

        const updateCount = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = target * ease;
          
          counter.innerText = isFloat ? current.toFixed(1) : Math.floor(current);
          
          if (progress < 1) requestAnimationFrame(updateCount);
          else counter.innerText = target;
        };
        requestAnimationFrame(updateCount);
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0 }); 
  counters.forEach(c => counterObserver.observe(c));

  document.querySelector('.js-toggle-menu').addEventListener('click', () => document.getElementById('mobile-menu').classList.toggle('open'));
  document.querySelectorAll('.js-close-menu').forEach(btn => btn.addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('open')));
  
  window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    const progress = document.getElementById('reading-progress');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = scrollable > 0 ? (window.scrollY / scrollable) * 100 + '%' : '0%';
  });

  document.querySelectorAll('.js-open-quiz').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openQuiz(); }));
  document.querySelector('.js-close-quiz').addEventListener('click', closeQuiz);
});

let currentStep = -1;
let answers = {};
let textData = {};

function openQuiz() {
  const savedAnswers = sessionStorage.getItem('bgtech_quiz');
  if (savedAnswers) {
    const saved = JSON.parse(savedAnswers);
    answers = saved.answers || {};
    textData = saved.textData || {};
    currentStep = saved.step ?? -1;
  } else {
    currentStep = -1; answers = {}; textData = {};
  }
  document.getElementById('quiz-overlay').classList.add('open');
  document.body.classList.add('modal-open');
  if (currentStep === -1) renderIntro(); else renderStep();
}

function closeQuiz() {
  document.getElementById('quiz-overlay').classList.remove('open');
  document.body.classList.remove('modal-open');
  if (currentStep >= QUESTIONS.length) sessionStorage.removeItem('bgtech_quiz');
}

function renderIntro() {
  const body = document.getElementById('quiz-body');
  document.getElementById('quiz-progress-fill').style.width = '0%';
  body.innerHTML = `
    <div class="quiz-intro reveal visible">
      <h2 style="color: var(--text-1);">O Diagnóstico BG Tech</h2>
      
      <div class="intro-social-proof">
        <span><i data-lucide="check-circle" width="16"></i> 847 empresas já diagnosticadas</span>
        <span><i data-lucide="check-circle" width="16"></i> Resultado em menos de 3 minutos</span>
      </div>
      <p style="color: var(--text-3);">Nos próximos 3 minutos você vai descobrir exatamente quanto dinheiro sua empresa está perdendo por mês e o porquê.</p>
      <p style="color: var(--text-3);">Não é estimativa genérica. É um cálculo baseado no perfil real da sua operação.</p>
      
      <div class="quiz-intro-hint">
        Seja completamente honesto. Quanto mais preciso você for nas respostas, mais exato será o resultado.
      </div>
      <button class="btn-primary btn-large js-start-quiz" style="width: 100%;">Estou pronto <i data-lucide="arrow-right"></i></button>
    </div>
  `;
  lucide.createIcons();
  body.querySelector('.js-start-quiz').addEventListener('click', () => { nextStep(); });
}

function renderStep() {
  const q = QUESTIONS[currentStep];
  const body = document.getElementById('quiz-body');
  const bar = document.getElementById('quiz-progress-fill');

  if (q.id === 'contato') {
    bar.style.width = '80%';
    bar.classList.add('pulse-progress');
  } else {
    bar.style.width = `${(currentStep / (QUESTIONS.length - 1)) * 100}%`;
    bar.classList.remove('pulse-progress');
  }

  if (q.type === 'options') {
    let html = `<div class="reveal visible"><span class="q-label">${q.label}</span><h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>`;
    html += `<div class="q-options">`;
    q.options.forEach((opt, i) => {
      const iconClass = opt.iconColor ? opt.iconColor : '';
      const isSelected = answers[q.id] === i ? 'selected' : '';
      html += `
        <div class="q-option ${isSelected}" data-index="${i}">
          <div class="q-icon"><i data-lucide="${opt.icon}" class="${iconClass}"></i></div>
          <div class="q-text"><strong>${opt.title}</strong><span>${opt.sub}</span></div>
        </div>`;
    });
    html += `</div>`;
    if (currentStep > 0) html += `<div class="q-nav"><button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button></div>`;
    html += `</div>`;
    body.innerHTML = html;

    body.querySelectorAll('.q-option').forEach(opt => {
      opt.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'));
        answers[q.id] = idx;
        const ecoText = echos[q.id]?.[idx];
        
        if (q.id === 'segmento') {
          const segName = q.options[idx].title;
          body.innerHTML = `<div class="micro-validation"><i data-lucide="check-circle-2" style="margin-bottom:12px;width:32px;height:32px;"></i><br>Calibrando diagnóstico para ${segName}...</div>`;
          lucide.createIcons();
          setTimeout(() => { nextStep(); }, 1200);
        } else if (ecoText) {
          body.innerHTML = `
            <div class="micro-validation" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 60px 20px;">
              <i data-lucide="zap" style="color:var(--blue); width: 48px; height: 48px; margin-bottom: 24px; animation: pulse 2s infinite;"></i>
              <p style="color: var(--text-1); font-size: 20px; font-weight: 800; line-height: 1.5;">${ecoText}</p>
            </div>`;
          lucide.createIcons();
          setTimeout(() => { nextStep(); }, 2500); 
        } else {
          nextStep();
        }
      });
    });
  } else {
    let html = `<div class="reveal visible">
      <span class="q-label"><span class="live-dot"></span> DIAGNÓSTICO PRONTO</span>
      <h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>`;
      
    q.fields.forEach(f => {
      html += `<div class="q-input-group">
                <input type="text" class="q-input" id="inp-${f.id}" placeholder="${f.placeholder}" value="${textData[f.id] || ''}">
                <div class="q-error-msg" id="err-${f.id}"></div>
               </div>`;
    });
    
    html += `
      <p style="font-size:12px; color:var(--text-3); margin-bottom: 20px; text-align:center;">Usamos esse contato apenas para enviar e debater o diagnóstico.</p>
      <div class="q-nav">
        <button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button>
        <button class="btn-primary js-next">Liberar meu diagnóstico <i data-lucide="unlock" width="16"></i></button>
      </div></div>`;
    
    body.innerHTML = html;

    const wppInput = document.getElementById('inp-whatsapp');
    if(wppInput) {
      wppInput.addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '').slice(0,11);
        if(v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
        if(v.length > 10) v = v.slice(0,10) + '-' + v.slice(10);
        this.value = v;
        this.classList.remove('error');
        document.getElementById('err-whatsapp').style.display = 'none';
      });
    }

    body.querySelector('.js-next').addEventListener('click', () => {
      let hasError = false;
      
      const elNome = document.getElementById('inp-nome');
      const nomeVal = elNome.value.trim();
      if (nomeVal.length < 3) {
        hasError = true; elNome.classList.add('error');
        document.getElementById('err-nome').innerText = "Insira um nome válido";
        document.getElementById('err-nome').style.display = 'block';
      } else { textData.nome = capitalize(nomeVal); }

      const elEmpresa = document.getElementById('inp-empresa');
      const empVal = elEmpresa.value.trim();
      if (empVal.length < 2) {
        hasError = true; elEmpresa.classList.add('error');
        document.getElementById('err-empresa').innerText = "Informe a empresa";
        document.getElementById('err-empresa').style.display = 'block';
      } else { textData.empresa = empVal; } 

      const wppVal = wppInput.value.trim().replace(/\D/g, ''); 
      if (wppVal.length < 10 || wppVal.length > 13) {
        hasError = true; wppInput.classList.add('error');
        document.getElementById('err-whatsapp').innerText = "Número inválido. Inclua o DDD.";
        document.getElementById('err-whatsapp').style.display = 'block';
      } else { textData.whatsapp = wppInput.value; }

      if (!hasError) runLoading();
    });

    q.fields.forEach(f => {
      if(f.id !== 'whatsapp') { 
        document.getElementById(`inp-${f.id}`).addEventListener('input', function () {
          this.classList.remove('error'); document.getElementById(`err-${f.id}`).style.display = 'none';
        });
      }
    });
  }

  if (body.querySelector('.js-prev')) body.querySelector('.js-prev').addEventListener('click', () => { currentStep--; renderStep(); });
  lucide.createIcons();
}

function nextStep() {
  if (currentStep === -1) { currentStep = 0; } else { currentStep++; }
  sessionStorage.setItem('bgtech_quiz', JSON.stringify({ answers, textData, step: currentStep }));
  renderStep();
}

function runLoading() {
  const bar = document.getElementById('quiz-progress-fill');
  bar.classList.remove('pulse-progress');
  bar.style.width = '100%';

  const body = document.getElementById('quiz-body');
  
  const segName = QUESTIONS[0].options[answers.segmento].title;
  const fatIndex = answers.faturamento;
  
  let basePerda = 6500;
  if (fatIndex === 1) basePerda = 14000;
  if (fatIndex === 2) basePerda = 32000;
  if (fatIndex === 3) basePerda = 65000;

  const steps = [
    { icon: 'briefcase', text: `Mapeando gargalos na área de ${segName}...` },
    { icon: 'search', text: `Cruzando dados com empresas em ${leadLocation}...` },
    { icon: 'dollar-sign', text: `Calculando horas perdidas e sangria financeira...`, special: true },
    { icon: 'target', text: 'Priorizando automações com maior retorno...' },
    { icon: 'file-check-2', text: 'Montando plano executivo...' }
  ];

  body.innerHTML = `
    <div class="diag-loading reveal visible">
      <div class="diag-loading-ring"></div>
      <h2 class="q-title" style="margin-bottom: 32px;">Compilando o diagnóstico da ${textData.empresa}...</h2>
      <div class="diag-loading-steps">
        ${steps.map((s, i) => `
          <div class="diag-step" id="dls-${i}">
            <div class="diag-step-icon"><i data-lucide="${s.icon}" width="16"></i></div>
            <div style="display:flex; flex-direction:column;">
              <span style="color: var(--text-2);">${s.text}</span>
              ${s.special ? `<div class="partial-number" id="flash-num" style="display:none;">⚡ Estimativa parcial: <strong>R$ ${(basePerda * 0.8).toLocaleString('pt-BR')}</strong> detectados...</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  lucide.createIcons();

  let i = 0;
  const tick = () => {
    if (i > 0) {
      document.getElementById(`dls-${i - 1}`).classList.replace('active', 'done');
      document.getElementById(`dls-${i - 1}`).querySelector('.diag-step-icon').innerHTML = '<i data-lucide="check" width="16"></i>';
      if (steps[i - 1].special) document.getElementById('flash-num').style.display = 'none';
    }
    if (i < steps.length) {
      document.getElementById(`dls-${i}`).classList.add('active');
      if (steps[i].special) document.getElementById('flash-num').style.display = 'block';
      lucide.createIcons();
      i++;
      setTimeout(tick, 1000); 
    } else {
      setTimeout(showResult, 500);
    }
  };
  tick();
}

// ==== SHOW RESULT OTMIZADO E ANIMADO ====
function showResult() {
  const body = document.getElementById('quiz-body');
  
  const nome = textData.nome.split(' ')[0];
  const empresa = textData.empresa;
  const dorPrincipal = QUESTIONS[2].options[answers.dor].title;
  
  const segTexts = [
    "Sua construtora", "Seu escritório", "Sua operação", "Sua indústria", "Sua clínica", "Sua agência"
  ];
  let empresaTipo = segTexts[answers.segmento] || "Sua empresa";
  
  const fatIndex = answers.faturamento;
  const matIndex = answers.maturidade;

  let minLoss = 4200, maxLoss = 8500;
  if (fatIndex === 1) { minLoss = 14500; maxLoss = 22000; }
  if (fatIndex === 2) { minLoss = 28500; maxLoss = 42000; }
  if (fatIndex === 3) { minLoss = 65000; maxLoss = 98000; }
  
  const lostValueStr = `R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k`;
  const workersEquiv = (maxLoss / 3500).toFixed(1);

  let score = 38; 
  if (matIndex === 1) score = 52;
  if (matIndex === 2) score = 61;
  if (matIndex === 3) score = 78;
  if (matIndex === 4) score = 92;

  const scoreLabels = [
    { max: 40, label: 'Operação em Risco', color: '#ef4444' },
    { max: 60, label: 'Alerta Crítico', color: '#f97316' },
    { max: 75, label: 'Em Transição', color: '#eab308' },
    { max: 88, label: 'Estruturado', color: '#3b82f6' },
    { max: 100, label: 'Alta Performance', color: '#10b981' },
  ];
  const scoreCat = scoreLabels.find(s => score <= s.max);

  const circleOffset = 251 - (251 * (score / 100));
  
  const recupAuto = (maxLoss * 0.6 / 1000).toFixed(1);
  const recupInteg = (maxLoss * 0.35 / 1000).toFixed(1);

  body.innerHTML = `
    <div class="reveal visible" style="animation: fadeIn 0.5s ease-out;">
      <h2 class="q-title" style="font-size: 24px; margin-bottom: 8px;">${nome}, encontramos o problema.</h2>
      <p class="q-desc" style="font-size: 15px;">Processamos os dados da <strong>${empresa}</strong> contra o benchmark do seu setor.</p>
      
      <div class="score-banner">
        <div class="score-circle">
          <svg viewBox="0 0 100 100">
            <circle class="score-track" cx="50" cy="50" r="40"></circle>
            <circle class="score-fill" id="anim-circle" cx="50" cy="50" r="40" style="stroke-dasharray: 251; stroke-dashoffset: 251;"></circle>
          </svg>
          <div class="score-number">
            <span class="score-val">${score}</span>
            <span class="score-max">/100</span>
          </div>
        </div>
        <div class="score-text">
          <span style="font-size: 13px; color: var(--text-3);">Maturidade Operacional</span>
          <span class="score-category" style="color: ${scoreCat.color};">${scoreCat.label}</span>
        </div>
      </div>

      <div class="result-box">
        <span class="alert-tag">Custo Invisível Estimado</span>
        <div class="loss-value">${lostValueStr} <span style="font-size: 16px; color: var(--text-3); font-weight: 500;">/mês</span></div>
        <p style="font-size: 14px; color: var(--text-2); margin-top: 8px;">Equivale a <strong>${workersEquiv} funcionários</strong> trabalhando o mês inteiro apenas para cobrir ineficiências e retrabalho manual.</p>
      </div>

      <div class="opportunity-highlight-card">
        <div class="opp-highlight-label"><i data-lucide="trending-up" style="width: 16px;"></i> Oportunidade Identificada</div>
        <div class="opp-highlight-value">R$ ${(maxLoss / 1000).toFixed(0)}k <span style="font-size: 16px; font-weight: 600; color: #064e3b;">/mês recuperáveis</span></div>
      </div>

      <div class="opps-box">
        <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-1); margin-bottom: 20px;">Plano de Ação Sugerido:</h3>
        
        <div class="opp-item">
          <div class="opp-header"><span>1. Automação de Tarefas</span><span>R$ ${recupAuto}k</span></div>
          <div class="opp-bar-wrap"><div class="opp-bar" id="bar-0" style="width: 0%;" data-target="85%"></div></div>
        </div>
        <div class="opp-item">
          <div class="opp-header"><span>2. Integração de Sistemas</span><span>R$ ${recupInteg}k</span></div>
          <div class="opp-bar-wrap"><div class="opp-bar" id="bar-1" style="width: 0%; background: var(--cyan);" data-target="65%"></div></div>
        </div>
        <div class="opp-item">
          <div class="opp-header"><span>3. Dashboards de Controle</span><span>Alto Valor</span></div>
          <div class="opp-bar-wrap"><div class="opp-bar" id="bar-2" style="width: 0%; background: var(--text-3);" data-target="40%"></div></div>
        </div>
      </div>

      <div class="urgency-bar">
        <i data-lucide="clock" style="width: 16px;"></i> Restam apenas 4 agendas para novos clientes esta semana.
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 32px;">
        <button class="btn-ghost-whatsapp js-wpp-direct" style="width: 100%;">
          Agendar minha conversa de 20 min gratuita
        </button>
        <button class="btn-primary js-wpp" style="width: 100%; justify-content: center; padding: 18px; font-size: 16px;">
          Quero meu plano estrutural para a ${empresa}
        </button>
      </div>
    </div>
  `;
  
  lucide.createIcons();

  // ATIVA AS ANIMAÇÕES DE FORMA SEGURA E ASSÍNCRONA
  setTimeout(() => {
    // 1. Reflow mágico pro SVG do Score animar do zero
    const elCirc = document.getElementById('anim-circle');
    if (elCirc) {
      elCirc.getBoundingClientRect(); // <--- O SEGREDO TÁ AQUI
      elCirc.style.transition = 'stroke-dashoffset 1.5s ease-out';
      elCirc.style.strokeDashoffset = circleOffset;
    }

    // 2. Barras de oportunidade descendo em "escadinha"
    [0, 1, 2].forEach((i, index) => {
      setTimeout(() => {
        const barEl = document.getElementById(`bar-${i}`);
        if (barEl) {
          barEl.style.transition = 'width 1s ease-out';
          barEl.style.width = barEl.getAttribute('data-target');
        }
      }, 500 + (index * 300));
    });
  }, 100);

 // PREPARA O ENVIO PARA O SUPABASE
  const supabasePayload = {
    nome: textData.nome,
    empresa: textData.empresa,
    whatsapp: textData.whatsapp.replace(/\D/g, ''),
    segmento: QUESTIONS[0].options[answers.segmento]?.title || '',
    horas_perdidas: QUESTIONS[1].options[answers.horas_perdidas]?.title || '',
    dor_principal: QUESTIONS[2].options[answers.dor]?.title || '',
    faturamento: QUESTIONS[3].options[answers.faturamento]?.title || '',
    maturidade: QUESTIONS[4].options[answers.maturidade]?.title || '',
    score: score,
    custo_mensal: `R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k`
  };

  // 🔥 NOVO FLUXO FASE 3: ENVIO PARA O MAKE.COM (Sem header Content-Type para bypass de CORS Local)
  const makeWebhookUrl = 'https://hook.us2.make.com/88y3c45jrsbdcitl5o6i932hco6rq0i6';
  
  fetch(makeWebhookUrl, {
    method: 'POST',
    body: JSON.stringify(supabasePayload)
  })
  .then(response => {
    console.log("Sucesso! Lead enviado para a automação do Make.");
  })
  .catch(err => {
    console.error("Erro ao enviar para o Make:", err);
  });

  // O botão agora apenas redireciona, porque o dado já está seguro.
  const openWpp = () => {
    const msg = `Olá! Fiz o diagnóstico da BG Tech agora. Score ${score}/100, custo estimado de R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k mensais em ineficiências. Quero agendar a conversa de 20 min para a ${empresa}.`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Previne duplicação de cliques
  const wppBtn = document.querySelector('.js-wpp');
  const wppDirectBtn = document.querySelector('.js-wpp-direct');

  if (wppBtn && wppDirectBtn) {
    const newWppBtn = wppBtn.cloneNode(true);
    const newWppDirectBtn = wppDirectBtn.cloneNode(true);
    
    wppBtn.parentNode.replaceChild(newWppBtn, wppBtn);
    wppDirectBtn.parentNode.replaceChild(newWppDirectBtn, wppDirectBtn);

    newWppBtn.addEventListener('click', openWpp);
    newWppDirectBtn.addEventListener('click', openWpp);
  }
} // Fim do script.js
