// ==== CONFIGURAÇÕES BG TECH ====
const CONFIG = {
  whatsappNumber: '5511999998888', // MUDE AQUI PARA O SEU NUMERO REAL
  webhookUrl: '' // Webhook do Make.com / n8n
};

// 1. Fetch de Localização Blindado (Para FOMO Local)
let leadLocation = "sua região";
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000);

fetch('https://ipapi.co/json/', { signal: controller.signal })
  .then(r => r.json())
  .then(d => { if (d.city) leadLocation = d.city; })
  .catch(() => {}) 
  .finally(() => clearTimeout(timeout));

// 2. Utils 
const capitalize = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ==== A MATRIZ DE VENDAS CIALDINI ====
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
    desc: 'Informe para quem enviamos a análise completa da sua operação.',
    type: 'text',
    fields: [
      { id: 'nome', placeholder: 'Como você prefere ser chamado?' },
      { id: 'empresa', placeholder: 'Nome da empresa' },
      { id: 'whatsapp', placeholder: 'WhatsApp (com DDD)' }
    ]
  }
];

// OS ECOS DE VALIDAÇÃO (O ESPELHO)
const echos = {
  horas_perdidas: [
    null,
    "Esse padrão de fuga de horas aparece em 62% das empresas no seu estágio de crescimento.",
    "Atenção: Com esse volume, sua equipe perde efetivamente quase 2 dias inteiros por semana em rotinas braçais.",
    "Custo crítico: Acima de 30h semanais, o desperdício invisível supera facilmente o salário de um gestor."
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
    "Ótimo. Nessa faixa, cada R$1.000 economizado em operação vira lucro direto no fim do mês.",
    "Uma operação desse porte precisa de tecnologia robusta para não implodir sob o próprio peso.",
    "Com esse volume, qualquer ineficiência de 2% já representa dezenas de milhares de reais perdidos."
  ]
};

// ==== INICIALIZAÇÃO BLINDADA ====
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // UX Esc & Click Fora
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuiz(); });
  document.getElementById('quiz-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('quiz-overlay')) closeQuiz();
  });

  // Reveal Animations
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

  // Counters Dinâmicos (Bug do 0 resolvido com observer permissivo)
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
  }, { threshold: 0 }); // Threshold 0 garante que dispare assim que entrar
  counters.forEach(c => counterObserver.observe(c));

  // Menu Mobile
  document.querySelector('.js-toggle-menu').addEventListener('click', () => document.getElementById('mobile-menu').classList.toggle('open'));
  document.querySelectorAll('.js-close-menu').forEach(btn => btn.addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('open')));
  
  // Header Scrolled
  window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    const progress = document.getElementById('reading-progress');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = scrollable > 0 ? (window.scrollY / scrollable) * 100 + '%' : '0%';
  });

  // Quiz Binds
  document.querySelectorAll('.js-open-quiz').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openQuiz(); }));
  document.querySelector('.js-close-quiz').addEventListener('click', closeQuiz);
});

// ==== MOTOR DO QUIZ ====
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
      <h2>O Diagnóstico BG Tech</h2>
      
      <div class="intro-social-proof">
        <span><i data-lucide="check-circle" width="16"></i> 847 empresas já diagnosticadas</span>
        <span><i data-lucide="check-circle" width="16"></i> Resultado em menos de 3 minutos</span>
      </div>

      <p>Nos próximos 3 minutos você vai descobrir exatamente quanto dinheiro sua empresa está perdendo por mês e o porquê.</p>
      <p>Não é estimativa genérica. É um cálculo baseado no perfil real da sua operação.</p>
      
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

        // ECOS de Vendas
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
              <p style="color: var(--text-heading); font-size: 20px; font-weight: 800; line-height: 1.5;">${ecoText}</p>
            </div>`;
          lucide.createIcons();
          setTimeout(() => { nextStep(); }, 2500); 
        } else {
          nextStep();
        }
      });
    });
  } else {
    // TELA DE CONTATO (A Provação com Live Dot)
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
      <p style="font-size:12px; color:var(--text-3); margin-bottom: 20px; text-align:center;">Usamos esse contato apenas para falar sobre este diagnóstico. Nada de spam.</p>
      <div class="q-nav">
        <button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button>
        <button class="btn-primary js-next">Liberar meu diagnóstico <i data-lucide="unlock" width="16"></i></button>
      </div></div>`;
    body.innerHTML = html;

    // Máscara WPP BR
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

      // Validação Name: 3 letras
      const elNome = document.getElementById('inp-nome');
      const nomeVal = elNome.value.trim();
      if (nomeVal.length < 3) {
        hasError = true; elNome.classList.add('error');
        document.getElementById('err-nome').innerText = "Insira um nome válido";
        document.getElementById('err-nome').style.display = 'block';
      } else { textData.nome = capitalize(nomeVal); }

      // Validação Empresa (SEM CAPITALIZE para não quebrar Siglas)
      const elEmpresa = document.getElementById('inp-empresa');
      const empVal = elEmpresa.value.trim();
      if (empVal.length < 2) {
        hasError = true; elEmpresa.classList.add('error');
        document.getElementById('err-empresa').innerText = "Informe a empresa";
        document.getElementById('err-empresa').style.display = 'block';
      } else { textData.empresa = empVal; } 

      // Validação WPP
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

function showResult() {
  const body = document.getElementById('quiz-body');
  const nome = textData.nome.split(' ')[0];
  const empresa = textData.empresa;
  const dorPrincipal = QUESTIONS[2].options[answers.dor].title;

  // 1. O ESPELHO 
  const segTexts = [
    "Sua construtora", "Seu escritório", "Sua operação", "Sua indústria", "Sua clínica", "Sua agência"
  ];
  let empresaTipo = segTexts[answers.segmento] || "Sua empresa";
  
  let mirrorText = `${empresaTipo} chegou num ponto crítico. A operação cresceu, mas os processos não. Você sente que a equipe trabalha mais, mas a empresa não cresce proporcionalmente. E o diagnóstico confirma: <strong>${dorPrincipal}</strong> é o gargalo principal na sua operação.`;

  // 2. A DOR FINANCEIRA 
  const fatIndex = answers.faturamento;
  const matIndex = answers.maturidade;

  let minLoss = 4200, maxLoss = 8500;
  if (fatIndex === 1) { minLoss = 14500; maxLoss = 22000; }
  if (fatIndex === 2) { minLoss = 28500; maxLoss = 42000; }
  if (fatIndex === 3) { minLoss = 65000; maxLoss = 98000; }

  const lostValueStr = `R$ ${minLoss.toLocaleString('pt-BR')} a R$ ${maxLoss.toLocaleString('pt-BR')} /mês`;
  const workersEquiv = (maxLoss / 3500).toFixed(1);

  // 3. O SCORE CATEGORIZADO
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

  const recupAuto = (maxLoss * 0.6).toLocaleString('pt-BR');
  const recupInteg = (maxLoss * 0.35).toLocaleString('pt-BR');
  const totalRecup = (maxLoss * 0.95).toLocaleString('pt-BR');

  body.innerHTML = `
    <div class="reveal visible">
      <h2 class="q-title" style="font-size: 24px;">${nome}, encontramos o problema.</h2>
      <div class="mirror-text">
        ${mirrorText}
      </div>

      <div class="score-banner">
         <div class="score-circle">
           <svg viewBox="0 0 100 100">
             <circle class="score-track" cx="50" cy="50" r="40"></circle>
             <circle class="score-fill" id="anim-circle" cx="50" cy="50" r="40" style="stroke-dashoffset: 251;"></circle>
           </svg>
           <div class="score-number">
             <span class="score-val">${score}</span>
             <span class="score-max">/100</span>
           </div>
         </div>
         <div class="score-text">
           <span class="score-category" style="color: ${scoreCat.color};">${scoreCat.label}</span>
           <p style="margin-top: 8px;">Você está entre os 34% de empresas em ${leadLocation} que identificaram a dor, mas não agiram. As que resolveram têm score médio de 78+. A diferença é a automação.</p>
         </div>
      </div>
      
      <div class="result-box">
        <div class="alert-tag">CUSTO MENSAL DAS INEFICIÊNCIAS</div>
        <div class="loss-value">${lostValueStr}</div>
        <div class="loss-desc">Baseado no faturamento e padrão da sua região. Esse valor sai direto da margem de lucro.</div>
        <div class="equivalence">Equivale a ${workersEquiv} funcionários trabalhando o mês inteiro só para cobrir retrabalho.</div>
      </div>

      <div class="opps-box">
        <div class="opp-item">
           <div class="opp-header"><span>1. Automação de tarefas repetitivas</span><span>Alto ROI</span></div>
           <div class="opp-bar-wrap"><div class="opp-bar" id="bar-0" style="width: 0%;"></div></div>
           <div class="opp-sub">Potencial de recuperação: R$ ${recupAuto}/mês</div>
        </div>
        <div class="opp-item">
           <div class="opp-header"><span>2. Integração dos sistemas atuais</span><span>Médio/Alto</span></div>
           <div class="opp-bar-wrap"><div class="opp-bar" id="bar-1" style="width: 0%;"></div></div>
           <div class="opp-sub">Potencial de recuperação: R$ ${recupInteg}/mês</div>
        </div>
        <div class="opp-item">
           <div class="opp-header"><span>3. Dashboard de gestão em tempo real</span><span>Estratégico</span></div>
           <div class="opp-bar-wrap"><div class="opp-bar" id="bar-2" style="width: 0%;"></div></div>
           <div class="opp-sub">Impacto drástico em tomada de decisão e escala</div>
        </div>
        <div class="total-opp-box">
           <span class="total-opp-label">OPORTUNIDADE IDENTIFICADA</span>
           <span class="total-opp-val">R$ ${totalRecup}/mês recuperáveis</span>
        </div>
      </div>
      
      <div style="border-top: 1px solid var(--border-lt); padding-top: 32px;">
        
        <div class="urgency-bar">
          <i data-lucide="clock" width="16"></i>
          Diagnósticos aprofundados disponíveis esta semana: <strong>4 vagas</strong>
        </div>

        <p style="font-size: 16px; color: var(--text-3); margin-bottom: 24px; line-height: 1.6;">
          ${nome}, o plano está pronto. O próximo passo é uma conversa de 20 minutos com nosso time. Sem apresentação de vendas e sem propostas no ar. <strong>Nossos especialistas já viram este diagnóstico antes de falar com você.</strong>
        </p>

        <button class="btn-primary js-wpp" style="width:100%; padding: 20px; font-size: 16px; margin-bottom: 12px;">
          Quero meu plano para a ${empresa} <i data-lucide="arrow-right" width="18"></i>
        </button>
        <button class="btn-ghost-whatsapp js-wpp-direct" style="width:100%;">
          <i data-lucide="message-circle" width="18"></i> Falar agora com nosso time
        </button>
        
        <p style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 12px;">Resposta em até 2 horas úteis. Sem compromisso.</p>
      </div>
    </div>`;
  lucide.createIcons();

  // ANIMAÇÕES DAS BARRAS E CIRCULO
  setTimeout(() => {
    const elCirc = document.getElementById('anim-circle');
    if (elCirc) elCirc.style.strokeDashoffset = circleOffset;

    const bars = [
      { id: 'bar-0', w: '85%', d: 500 },
      { id: 'bar-1', w: '65%', d: 800 },
      { id: 'bar-2', w: '45%', d: 1100 }
    ];
    bars.forEach(b => {
      setTimeout(() => {
        const barEl = document.getElementById(b.id);
        if (barEl) barEl.style.width = b.w;
      }, b.d);
    });
  }, 100);

  // PAYLOAD ENRIQUECIDO PARA O WEBHOOK
  const webhookPayload = {
    nome: textData.nome,
    empresa: textData.empresa,
    whatsapp: textData.whatsapp.replace(/\D/g, ''),
    segmento: QUESTIONS[0].options[answers.segmento]?.title || '',
    horas_perdidas: QUESTIONS[1].options[answers.horas_perdidas]?.title || '',
    dor_principal: QUESTIONS[2].options[answers.dor]?.title || '',
    faturamento: QUESTIONS[3].options[answers.faturamento]?.title || '',
    maturidade: QUESTIONS[4].options[answers.maturidade]?.title || '',
    score: score,
    score_categoria: scoreCat.label,
    custo_min: minLoss,
    custo_max: maxLoss,
    localizacao: leadLocation,
    utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'organico',
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
    visualizou_resultado: true,
    timestamp: new Date().toISOString()
  };

  const openWpp = () => {
    if (CONFIG.webhookUrl) {
      fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      }).catch(() => { });
    }
    const msg = `Olá! Fiz o diagnóstico da BG Tech agora. Score ${score}/100, custo estimado de R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k mensais em ineficiências. Quero conversar sobre os próximos passos para a ${empresa}.`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Prevenindo Multiplos Event Listeners 
  const wppBtn = body.querySelector('.js-wpp');
  const wppDirectBtn = body.querySelector('.js-wpp-direct');

  const newWppBtn = wppBtn.cloneNode(true);
  const newWppDirectBtn = wppDirectBtn.cloneNode(true);
  wppBtn.parentNode.replaceChild(newWppBtn, wppBtn);
  wppDirectBtn.parentNode.replaceChild(newWppDirectBtn, wppDirectBtn);

  newWppBtn.addEventListener('click', openWpp);
  newWppDirectBtn.addEventListener('click', openWpp);
}
