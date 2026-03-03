const CONFIG = {
  whatsappNumber: '5543999998888',
  webhookUrl: '',
  webhookToken: '',
  supabaseUrl: 'https://urpuiznydrlwmaqhdids.supabase.co',
  supabaseKey: 'sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0'
};

const getRuntimeWebhookConfig = () => {
  const params = new URLSearchParams(window.location.search);
  const queryWebhook = params.get('webhook');
  const queryToken = params.get('token');

  if (queryWebhook) localStorage.setItem('bgtech_webhook_url', queryWebhook);
  if (queryToken) localStorage.setItem('bgtech_webhook_token', queryToken);

  const webhookUrl = queryWebhook || localStorage.getItem('bgtech_webhook_url') || CONFIG.webhookUrl;
  const webhookToken = queryToken || localStorage.getItem('bgtech_webhook_token') || CONFIG.webhookToken;

  return { webhookUrl, webhookToken };
};

const postWebhook = async (url, payload, token = '') => {
  if (!url) return { ok: false, skipped: true };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true
    });

    clearTimeout(timeoutId);
    return { ok: response.ok, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    return { ok: false, error: error?.message || 'unknown_error' };
  }
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
    id: 'segmento', label: 'PASSO 1 DE 6',
    title: 'Qual o segmento da sua empresa?',
    desc: 'Isso calibra os benchmarks e o vocabulário do seu diagnóstico.',
    type: 'options',
    options: [
      { icon: 'hard-hat', title: 'Construção Civil', sub: 'Obras, projetos e gestão de equipe de campo' },
      { icon: 'scale', title: 'Jurídico e Contabilidade', sub: 'Escritórios, processos e clientes recorrentes' },
      { icon: 'store', title: 'Comércio e Varejo', sub: 'Loja física, e-commerce ou distribuidora' },
      { icon: 'factory', title: 'Indústria e Manufatura', sub: 'Produção, estoque e operation fabril' },
      { icon: 'stethoscope', title: 'Saúde', sub: 'Clínicas, laboratórios e prestadores de saúde' },
      { icon: 'briefcase', title: 'Serviços e Consultoria', sub: 'Agências, consultorias e empresas de serviço' }
    ]
  },
  {
    id: 'horas_perdidas', label: 'PASSO 2 DE 6',
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
    id: 'dor', label: 'PASSO 3 DE 6',
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
    id: 'faturamento', label: 'PASSO 4 DE 6',
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
    id: 'maturidade', label: 'PASSO 5 DE 6',
    title: 'Sendo completamente honesto, como você descreveria a tecnologia hoje?',
    desc: 'O nível de maturidade digital atual da empresa.',
    type: 'options',
    options: [
      { icon: 'file-text', iconColor: 'icon-red', title: 'No papel ou Excel', sub: 'Tudo manual dependente de pessoas' },
      { icon: 'box', iconColor: 'icon-orange', title: 'Sistemas básicos', sub: 'Até tem ferramenta mas ninguém usa direito' },
      { icon: 'boxes', iconColor: 'icon-yellow', title: 'Sistemas sem integração', sub: 'Dados espalhados e muito retrabalho' },
      { icon: 'server', iconColor: 'icon-blue-light', title: 'Sistemas razoáveis', sub: 'Funciona mas tem espaço pra evoluir' },
      { icon: 'rocket', iconColor: 'icon-cyan', title: 'Tecnologia boa', sub: 'Base sólida, preciso de um parceiro estratégico' }
    ]
  },
  {
    id: 'janela_decisao', label: 'PASSO 6 DE 6',
    title: 'Se o diagnóstico fizer sentido, em quanto tempo você quer começar?',
    desc: 'Isso define a prioridade de atendimento e o tipo de plano recomendado.',
    type: 'options',
    options: [
      { icon: 'flame', title: 'Em até 7 dias', sub: 'Quero ação imediata e ganho rápido' },
      { icon: 'calendar-clock', title: 'Em 15 a 30 dias', sub: 'Quero organizar internamente e iniciar com segurança' },
      { icon: 'calendar', title: 'Em 1 a 3 meses', sub: 'Estou validando cenário e prioridade' },
      { icon: 'book-open', title: 'Só estudando por enquanto', sub: 'Quero entender melhor antes de decidir' }
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
  ],
  janela_decisao: [
    "Perfeito. Vamos priorizar ações de impacto imediato para acelerar seu resultado.",
    "Ótimo timing. Dá para estruturar implementação com controle e previsibilidade.",
    "Faz sentido. Vamos deixar um plano de maturação para você avançar no momento certo.",
    "Sem problema. Você recebe clareza agora e decide quando avançar."
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // A/B testing de copy (hero + CTAs)
  const getCopyVariant = () => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('ab');
    const valid = ['a', 'b', 'c'];

    if (forced && valid.includes(forced)) {
      localStorage.setItem('bgtech_ab_variant', forced);
      return forced;
    }

    const stored = localStorage.getItem('bgtech_ab_variant');
    if (stored && valid.includes(stored)) return stored;

    const random = valid[Math.floor(Math.random() * valid.length)];
    localStorage.setItem('bgtech_ab_variant', random);
    return random;
  };

  const copyVariants = {
    a: {
      headline: 'Perde vendas porque demora pra responder?<br><span class="hero-highlight">Equipe afogada em planilhas manuais?</span>',
      subtitle: 'Este diagnóstico gratuito é para empresas B2B de 5 a 50 colaboradores que querem escalar sem contratar mais time: mostramos onde você perde margem hoje e o que automatizar primeiro sem trocar os sistemas atuais.',
      cta: 'Descobrir Quanto Estou Perdendo Agora'
    },
    b: {
      headline: 'Sua operação cresce, mas o lucro não acompanha?<br><span class="hero-highlight">Descubra onde a margem está vazando.</span>',
      subtitle: 'Em poucos minutos você visualiza o custo oculto de processos manuais e recebe um plano de automação com foco em caixa e produtividade.',
      cta: 'Quero meu plano de automação'
    },
    c: {
      headline: 'Quanto custa manter tudo no manual por mais 30 dias?<br><span class="hero-highlight">Veja o impacto real no seu caixa.</span>',
      subtitle: 'Se sua equipe perde tempo com retrabalho e sistemas desconectados, este diagnóstico mostra as 3 ações com maior retorno imediato.',
      cta: 'Ver meu diagnóstico em 3 minutos'
    }
  };

  const activeVariant = getCopyVariant();
  const activeCopy = copyVariants[activeVariant];

  const heroHeadline = document.getElementById('hero-headline');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const ctaLabels = document.querySelectorAll('[data-cta-dynamic] .cta-label');

  if (heroHeadline && heroSubtitle && activeCopy) {
    heroHeadline.innerHTML = activeCopy.headline;
    heroSubtitle.textContent = activeCopy.subtitle;
    ctaLabels.forEach((label) => { label.textContent = activeCopy.cta; });
  }
  
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuiz(); });
  document.getElementById('quiz-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('quiz-overlay')) closeQuiz();
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [...document.querySelectorAll('.reveal')].filter(el => !el.closest('#hero'));

  if (prefersReducedMotion) {
    revealTargets.forEach(el => el.classList.add('revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach((el, i) => {
      // Stagger per section: reset delay counter per parent section
      const section = el.closest('section') || el.closest('.trust-fade') || el.parentElement;
      if (!section._revealIdx) section._revealIdx = 0;
      el.style.setProperty('--delay', `${section._revealIdx * 80}ms`);
      section._revealIdx++;
      revealObserver.observe(el);
    });
  }

  const processSteps = document.querySelector('.process-steps');
  if (processSteps && !prefersReducedMotion) {
    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const line = document.getElementById('process-line');
          if (line) line.style.width = '100%';
          processObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    processObserver.observe(processSteps);
  }

  // CONTADORES ROBUSTOS — usa data-target, data-prefix, data-suffix do HTML
  const counters = document.querySelectorAll('.counter[data-target]');
  if (counters.length && !prefersReducedMotion) {
    const animateCounterEl = (el) => {
      const target = parseFloat(el.dataset.target);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const isDecimal = target % 1 !== 0;
      const start = performance.now();

      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        el.textContent = prefix +
          (isDecimal ? current.toFixed(1) : Math.floor(current)) +
          suffix;

        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = prefix +
          (isDecimal ? target.toFixed(1) : target) + suffix;
      };
      requestAnimationFrame(update);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounterEl(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    counters.forEach(el => counterObserver.observe(el));
  }

  const menuBtn = document.querySelector('.js-toggle-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn) {
      menuBtn.addEventListener('click', () => {
          const isOpen = mobileMenu.classList.contains('open');
          mobileMenu.classList.toggle('open', !isOpen);
          menuBtn.setAttribute('aria-expanded', !isOpen);
      });
  }
  document.querySelectorAll('.js-close-menu').forEach(btn => btn.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }));
  

  window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    const progress = document.getElementById('reading-progress');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = scrollable > 0 ? (window.scrollY / scrollable) * 100 + '%' : '0%';
    
    // Fade out scroll indicator ao rolar
    if (scrollIndicator) {
      const fadeStart = 100;
      const fadeUntil = 400;
      let opacity = 1;
      
      if (window.scrollY <= fadeStart) {
        opacity = 0.7;
      } else if (window.scrollY <= fadeUntil) {
        opacity = 0.7 - ((window.scrollY - fadeStart) / (fadeUntil - fadeStart)) * 0.7;
      } else {
        opacity = 0;
      }
      
      scrollIndicator.style.opacity = opacity;
      if (opacity === 0) scrollIndicator.style.pointerEvents = 'none';
      else scrollIndicator.style.pointerEvents = 'auto';
    }
  });

  // Parallax suave no hero (máx 20px deslocamento)
  const heroContent = document.querySelector('.hero-content');
  if (heroContent && window.matchMedia('(min-width: 769px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const heroHeight = document.getElementById('hero')?.offsetHeight || 0;
      if (scrolled < heroHeight) {
        const parallaxOffset = Math.min(scrolled * 0.3, 20);
        heroContent.style.transform = `translateY(${parallaxOffset}px)`;
        heroContent.style.opacity = 1 - (scrolled / heroHeight) * 0.3;
      }
    }, { passive: true });
  }

  // Scroll suave ao clicar no indicador
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const trustBar = document.getElementById('trust-bar');
      if (trustBar) {
        trustBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const isActive = item.classList.contains('active');
      const answer = item.querySelector('.faq-answer');
      
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
        faq.querySelector('.faq-answer').style.maxHeight = null;
      });
      
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 40 + "px"; 
      }
    });
  });

  document.querySelectorAll('.js-open-quiz').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openQuiz(); }));
  const closeBtn = document.querySelector('.js-close-quiz');
  if(closeBtn) closeBtn.addEventListener('click', closeQuiz);
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
  
  const quizOverlay = document.getElementById('quiz-overlay');
  const quizBody = document.getElementById('quiz-body');
  
  if(quizOverlay) {
      quizOverlay.classList.add('open');
      quizOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      
      if (quizBody.innerHTML.trim() === '') {
          quizBody.innerHTML = `
             <div style="text-align:center; padding: 60px 20px;">
               <div class="diag-loading-ring"></div>
               <p style="font-weight: 600;">Calibrando motor de diagnóstico...</p>
             </div>`;
          setTimeout(() => {
              if (quizBody.innerHTML.includes('Calibrando motor')) { 
                  quizBody.innerHTML = `
                     <div style="text-align:center; padding: 60px 20px;">
                       <p style="color: #ef4444; font-weight: 800; margin-bottom: 16px;">O diagnóstico encontrou um gargalo na rede.</p>
                       <a href="https://wa.me/5543999998888" target="_blank" class="btn-primary" style="display:inline-flex;">Continuar via WhatsApp</a>
                     </div>`;
              }
          }, 4000);
      }
  }
  
  if (currentStep === -1) renderIntro(); else renderStep();
}

function closeQuiz() {
  const quizOverlay = document.getElementById('quiz-overlay');
  if(quizOverlay) {
      quizOverlay.classList.remove('open');
      quizOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
  }
  if (currentStep >= QUESTIONS.length) sessionStorage.removeItem('bgtech_quiz');
}

function renderIntro() {
  const body = document.getElementById('quiz-body');
  const progressFill = document.getElementById('quiz-progress-fill');
  if(progressFill) progressFill.style.width = '0%';
  
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
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  const startBtn = body.querySelector('.js-start-quiz');
  if(startBtn) startBtn.addEventListener('click', () => { nextStep(); });
}

function renderStep() {
  const q = QUESTIONS[currentStep];
  const body = document.getElementById('quiz-body');
  const bar = document.getElementById('quiz-progress-fill');
  
  if(bar) {
      if (q.id === 'contato') {
        bar.style.width = '80%';
        bar.classList.add('pulse-progress');
      } else {
        bar.style.width = `${(currentStep / (QUESTIONS.length - 1)) * 100}%`;
        bar.classList.remove('pulse-progress');
      }
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
          if (typeof lucide !== 'undefined') lucide.createIcons();
          setTimeout(() => { nextStep(); }, 1200);
        } else if (ecoText) {
          body.innerHTML = `
            <div class="micro-validation" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 60px 20px;">
              <i data-lucide="zap" style="color:var(--blue); width: 48px; height: 48px; margin-bottom: 24px; animation: pulse 2s infinite;"></i>
              <p style="color: var(--text-1); font-size: 20px; font-weight: 800; line-height: 1.5;">${ecoText}</p>
            </div>`;
          if (typeof lucide !== 'undefined') lucide.createIcons();
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
      <p style="font-size:12px; color:var(--text-3); margin-bottom: 20px; text-align:center;">Usamos esse contato apenas para enviar e debater o diagnóstico. Sem spam.</p>
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
    
    const nextBtn = body.querySelector('.js-next');
    if(nextBtn) {
        nextBtn.addEventListener('click', () => {
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
    }
    
    q.fields.forEach(f => {
      if(f.id !== 'whatsapp') { 
        const inputEl = document.getElementById(`inp-${f.id}`);
        if(inputEl) {
            inputEl.addEventListener('input', function () {
              this.classList.remove('error'); 
              document.getElementById(`err-${f.id}`).style.display = 'none';
            });
        }
      }
    });
  }
  
  const prevBtn = body.querySelector('.js-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => { currentStep--; renderStep(); });
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function nextStep() {
  if (currentStep === -1) { currentStep = 0; } else { currentStep++; }
  sessionStorage.setItem('bgtech_quiz', JSON.stringify({ answers, textData, step: currentStep }));
  renderStep();
}

function runLoading() {
  const bar = document.getElementById('quiz-progress-fill');
  if(bar) {
      bar.classList.remove('pulse-progress');
      bar.style.width = '100%';
  }
  const body = document.getElementById('quiz-body');
  
  const segName = QUESTIONS[0].options[answers.segmento].title;
  const fatIndex = answers.faturamento;
  const decIndex = answers.janela_decisao;
  
  let basePerda = 6500;
  if (fatIndex === 1) basePerda = 14000;
  if (fatIndex === 2) basePerda = 32000;
  if (fatIndex === 3) basePerda = 65000;

  const steps = [
    { icon: 'briefcase', text: `Mapeando gargalos na área de ${segName}...` },
    { icon: 'search', text: `Cruzando dados com empresas em ${leadLocation}...` },
    { icon: 'dollar-sign', text: `Calculando horas perdidas e sangria financeira...`, special: true },
    { icon: 'activity', text: decIndex <= 1 ? 'Priorizando plano de execução acelerada...' : 'Priorizando plano de evolução por etapas...' },
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
    
  if (typeof lucide !== 'undefined') lucide.createIcons();

  let i = 0;
  const tick = () => {
    if (i > 0) {
      const prevEl = document.getElementById(`dls-${i - 1}`);
      if (prevEl) {
        prevEl.classList.replace('active', 'done');
        const icon = prevEl.querySelector('.diag-step-icon');
        if (icon) icon.innerHTML = '<i data-lucide="check" width="16"></i>';
        if (steps[i - 1].special) {
          const flashNum = document.getElementById('flash-num');
          if (flashNum) flashNum.style.display = 'none';
        }
      }
    }
    if (i < steps.length) {
      const currEl = document.getElementById(`dls-${i}`);
      if (currEl) {
        currEl.classList.add('active');
        if (steps[i].special) {
          const flashNum = document.getElementById('flash-num');
          if (flashNum) flashNum.style.display = 'block';
        }
      }
      lucide.createIcons();
      i++;
      setTimeout(tick, 1000); 
    } else {
      setTimeout(showResult, 500);
    }
  };
  
  setTimeout(() => {
    if (i < steps.length) {
      console.warn('Quiz loading timeout - forcing result');
      setTimeout(showResult, 100);
    }
  }, 10000);
  
  tick();
}

function showResult() {
  const body = document.getElementById('quiz-body');
  const nome = textData.nome.split(' ')[0];
  const empresa = textData.empresa;
  
  const fatIndex = answers.faturamento;
  const matIndex = answers.maturidade;
  const horasIndex = answers.horas_perdidas;
  const dorIndex = answers.dor;
  const decIndex = answers.janela_decisao;
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

  if (horasIndex >= 2) score = Math.max(35, score - 8);
  if (decIndex === 0) score = Math.max(30, score - 6);
  if (decIndex === 3) score = Math.min(95, score + 5);

  const scoreLabels = [
    { max: 40, label: 'Operação em Risco', color: '#ef4444' },
    { max: 60, label: 'Alerta Crítico', color: '#f97316' },
    { max: 75, label: 'Em Transição', color: '#eab308' },
    { max: 88, label: 'Estruturado', color: '#3b82f6' },
    { max: 100, label: 'Alta Performance', color: '#10b981' },
  ];
  const scoreCat = scoreLabels.find(s => score <= s.max);
  const circleOffset = 251 - (251 * (score / 100));

  const leadTemperature = (() => {
    if (decIndex === 0 && (fatIndex >= 1 || horasIndex >= 2)) return 'Quente';
    if (decIndex <= 1) return 'Morno';
    return 'Frio';
  })();

  const slaCopy = leadTemperature === 'Quente'
    ? 'Atendimento prioritário: nossa equipe entra em contato em até 20 minutos.'
    : leadTemperature === 'Morno'
      ? 'Atendimento recomendado: retorno da equipe em até 2 horas úteis.'
      : 'Você pode receber o plano e avançar no seu timing com suporte consultivo.';

  const segOptResult = QUESTIONS[0].options[answers.segmento];
  const benchmarkMap = {
    'Construção Civil': 'No seu segmento, os maiores ganhos costumam vir de automação de aprovações e integração de obra/financeiro.',
    'Jurídico e Contabilidade': 'No seu segmento, o gargalo mais comum é retrabalho operacional e atraso de retorno ao cliente.',
    'Comércio e Varejo': 'No seu segmento, a maior perda costuma estar em tempo comercial e dados distribuídos entre sistemas.',
    'Indústria e Manufatura': 'No seu segmento, o principal impacto está em integração entre operação, qualidade e gestão.',
    'Saúde': 'No seu segmento, ganhos rápidos aparecem com roteamento de atendimento e integração de agenda.',
    'Serviços e Consultoria': 'No seu segmento, o maior salto vem de padronização de funil e automação de follow-up.'
  };
  const benchmarkText = benchmarkMap[segOptResult?.title] || 'Sua operação tem potencial de ganho relevante com integração de processos e redução de retrabalho.';

  const now = new Date();
  const diagnosticId = `BG-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  
  const recupAuto = (maxLoss * 0.6 / 1000).toFixed(1);
  const recupInteg = (maxLoss * 0.35 / 1000).toFixed(1);
  const recupDash = (maxLoss * 0.2 / 1000).toFixed(1);

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

      <div class="benchmark-box">
        <div class="benchmark-title"><i data-lucide="scan-search" style="width: 16px;"></i> Leitura de benchmark do seu segmento</div>
        <p>${benchmarkText}</p>
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

      <div class="exclusive-plan">
        <h3>Plano exclusivo de 90 dias para ${empresa}</h3>
        <div class="plan-grid">
          <div class="plan-step"><strong>0-30 dias</strong><span>Automação de tarefas críticas</span><em>Potencial: R$ ${recupAuto}k/mês</em></div>
          <div class="plan-step"><strong>31-60 dias</strong><span>Integração entre sistemas-chave</span><em>Potencial: R$ ${recupInteg}k/mês</em></div>
          <div class="plan-step"><strong>61-90 dias</strong><span>Painel de gestão e previsibilidade</span><em>Potencial adicional: R$ ${recupDash}k/mês</em></div>
        </div>
      </div>

      <div class="urgency-bar">
        <i data-lucide="clock" style="width: 16px;"></i> Nossa equipe entra em contato com você em até 20 minutos úteis
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 32px;">
        <button class="btn-priority-contact js-priority-contact" style="width: 100%;">
          <i data-lucide="phone-call" style="width: 18px;"></i>
          Quero conversar com a equipe em 20 minutos
        </button>
      </div>
    </div>
  `;
  
  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTimeout(() => {
    const elCirc = document.getElementById('anim-circle');
    if (elCirc) {
      elCirc.getBoundingClientRect(); 
      elCirc.style.transition = 'stroke-dashoffset 1.5s ease-out';
      elCirc.style.strokeDashoffset = circleOffset;
    }
    
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

  const segOpt = QUESTIONS[0].options[answers.segmento];
  const horasOpt = QUESTIONS[1].options[answers.horas_perdidas];
  const dorOpt = QUESTIONS[2].options[answers.dor];
  const fatOpt = QUESTIONS[3].options[answers.faturamento];
  const matOpt = QUESTIONS[4].options[answers.maturidade];
  const decOpt = QUESTIONS[5].options[answers.janela_decisao];

  const supabasePayload = {
    nome: textData.nome,
    empresa: textData.empresa,
    whatsapp: textData.whatsapp.replace(/\D/g, ''),
    segmento: segOpt ? `${segOpt.title} (${segOpt.sub})` : '',
    horas_perdidas: horasOpt ? horasOpt.title : '',
    dor_principal: dorOpt ? `${dorOpt.title}: ${dorOpt.sub}` : '',
    faturamento: fatOpt ? fatOpt.title : '',
    maturidade: matOpt ? matOpt.title : '',
    janela_decisao: decOpt ? decOpt.title : '',
    lead_temperature: leadTemperature,
    score: score,
    custo_mensal: `R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k`,
    diagnostico_id: diagnosticId
  };

  const runtimeWebhook = getRuntimeWebhookConfig();

  const notifyHotLead = async (origin = 'auto') => {
    if (leadTemperature !== 'Quente') return;
    if (!runtimeWebhook.webhookUrl) return;

    const hotLeadPayload = {
      event: 'hot_lead_alert',
      source: 'site-principal-quiz',
      origin,
      prioridade: 'alta',
      diagnostico_id: diagnosticId,
      empresa: textData.empresa,
      nome: textData.nome,
      whatsapp: textData.whatsapp,
      lead_temperature: leadTemperature,
      score,
      custo_mensal_estimado: `R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k`,
      janela_decisao: decOpt ? decOpt.title : '',
      dor_principal: dorOpt ? dorOpt.title : '',
      segmento: segOpt ? segOpt.title : '',
      created_at: new Date().toISOString()
    };

    try {
      await postWebhook(runtimeWebhook.webhookUrl, hotLeadPayload, runtimeWebhook.webhookToken);
    } catch (err) {
      console.error('❌ Erro ao notificar lead quente:', err);
    }
  };

  if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    fetch(`${CONFIG.supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(supabasePayload)
    })
    .catch(err => console.error("❌ Erro ao salvar:", err));
  }

  if (leadTemperature === 'Quente') {
    notifyHotLead('resultado_quiz');
  }

  const openWpp = () => {
    const msg = `Olá! Fiz o diagnóstico da BG Tech agora (ID ${diagnosticId}). Perfil ${leadTemperature}, score ${score}/100, custo estimado de R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k mensais em ineficiências. Quero agendar a conversa de 20 min para a ${empresa}.`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openPriorityWpp = () => {
    const msg = `Olá! Quero contato prioritário em até 20 minutos. Já finalizei o diagnóstico da ${empresa} (ID ${diagnosticId}), perfil ${leadTemperature}.`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    notifyHotLead('botao_prioritario');
    if (runtimeWebhook.webhookUrl) {
      postWebhook(runtimeWebhook.webhookUrl, {
        event: 'priority_cta_clicked',
        source: 'site-principal-quiz',
        diagnostico_id: diagnosticId,
        empresa: textData.empresa,
        nome: textData.nome,
        whatsapp: textData.whatsapp,
        lead_temperature: leadTemperature,
        score,
        created_at: new Date().toISOString()
      }, runtimeWebhook.webhookToken);
    }
  };

  const priorityBtn = document.querySelector('.js-priority-contact');
  if (priorityBtn) {
    const newPriorityBtn = priorityBtn.cloneNode(true);
    priorityBtn.parentNode.replaceChild(newPriorityBtn, priorityBtn);
    newPriorityBtn.addEventListener('click', openPriorityWpp);
  }
}
