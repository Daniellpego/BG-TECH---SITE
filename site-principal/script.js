const CONFIG = {
  whatsappNumber: (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.whatsapp) || '5543997800051',
  webhookUrl: '',
  webhookToken: '',
  supabaseUrl: (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.supabaseUrl) || 'https://urpuiznydrlwmaqhdids.supabase.co',
  supabaseKey: (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.supabaseAnonKey) || ''
};

// ── UTM helpers ──────────────────────────────────────────
function getUTM(param) {
  try { return new URLSearchParams(window.location.search).get(param) || null; }
  catch (_) { return null; }
}

function getOrigem() {
  var source = getUTM('utm_source');
  if (!source) return 'site_organico';
  var s = source.toLowerCase();
  if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) return 'meta_ads';
  if (s.includes('google')) return 'google_ads';
  if (s.includes('indicacao')) return 'indicacao';
  return 'site_organico';
}

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
  .catch(() => { })
  .finally(() => clearTimeout(timeout));

const capitalize = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const QUESTIONS = [
  {
    id: 'segmento', label: 'PASSO 1 DE 6',
    title: 'Com qual desses perfis sua empresa mais se identifica?',
    desc: 'Personalizamos cada diagnóstico por segmento. Seu resultado será comparado com empresas similares à sua.',
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
    id: 'horas_perdidas', label: 'PASSO 2 DE 6',
    title: 'Quantas horas por semana sua equipe gasta com retrabalho e tarefas que poderiam ser automáticas?',
    desc: 'Some mentalmente: copiar dados entre planilhas, responder manualmente, gerar relatórios no braço...',
    type: 'options',
    options: [
      { icon: 'timer', title: 'Menos de 5 horas', sub: 'Operação relativamente azeitada' },
      { icon: 'refresh-ccw', title: 'Entre 5 e 15 horas', sub: 'Dá pra ignorar, mas já custa dinheiro' },
      { icon: 'flame', title: 'Entre 15 e 30 horas', sub: 'Quase 2 dias inteiros por semana jogados fora' },
      { icon: 'skull', title: 'Mais de 30 horas', sub: 'O retrabalho virou o modelo de negócio' }
    ]
  },
  {
    id: 'dor', label: 'PASSO 3 DE 6',
    title: 'Qual desses gargalos mais corrói o lucro da sua empresa hoje?',
    desc: 'Ao nomear o problema, a solução fica mais clara. Escolha o que mais dói.',
    type: 'options',
    options: [
      { icon: 'clock', title: 'Processos manuais e retrabalho', sub: 'Equipe boa, gastando 30% do dia em tarefas sem valor' },
      { icon: 'cable', title: 'Sistemas que não se integram', sub: 'Ferramentas que não se falam = dados duplicados e furos' },
      { icon: 'alert-circle', title: 'Suporte de TI lento ou inexistente', sub: 'Cada hora parada custa mais do que parece' },
      { icon: 'bar-chart', title: 'Decisões no escuro', sub: 'Sem dados em tempo real, tudo é chute' },
      { icon: 'users', title: 'Equipe sobrecarregada', sub: 'Crescer virou sinônimo de contratar mais — não devia ser assim' }
    ]
  },
  {
    id: 'faturamento', label: 'PASSO 4 DE 6',
    title: 'Qual faixa melhor representa o faturamento mensal da sua empresa?',
    desc: 'Precisamos dessa referência para calcular o impacto real em R$ no seu diagnóstico.',
    type: 'options',
    options: [
      { icon: 'wallet', title: 'Até R$ 50 mil/mês', sub: 'Fase de validação e primeiros clientes' },
      { icon: 'trending-up', title: 'R$ 50k a R$ 200k/mês', sub: 'Ganhando tração — hora de escalar sem quebrar' },
      { icon: 'landmark', title: 'R$ 200k a R$ 500k/mês', sub: 'Operação sólida buscando eficiência máxima' },
      { icon: 'gem', title: 'Acima de R$ 500k/mês', sub: 'Estrutura robusta — cada 1% de melhoria vale muito' }
    ],
    badge: 'Empresas nesta faixa recebem atendimento prioritário'
  },
  {
    id: 'maturidade', label: 'PASSO 5 DE 6',
    title: 'Sendo completamente honesto: como está a tecnologia da sua empresa hoje?',
    desc: 'Sem julgamento — isso nos ajuda a encontrar exatamente onde estão os maiores ganhos pra você.',
    type: 'options',
    options: [
      { icon: 'file-text', iconColor: 'icon-red', title: 'Tudo no papel ou Excel', sub: '100% manual, dependente de pessoas pra tudo' },
      { icon: 'box', iconColor: 'icon-orange', title: 'Tem ferramentas, mas ninguém usa direito', sub: 'Paga software que vira enfeite' },
      { icon: 'boxes', iconColor: 'icon-yellow', title: 'Sistemas sem integração', sub: 'Dados espalhados em 5 lugares diferentes' },
      { icon: 'server', iconColor: 'icon-blue-light', title: 'Razoavelmente estruturado', sub: 'Funciona, mas tem muito espaço pra evoluir' },
      { icon: 'rocket', iconColor: 'icon-cyan', title: 'Tecnologia boa, preciso de parceiro', sub: 'Base sólida, falta só a engenharia certa' }
    ]
  },
  {
    id: 'teaser',
    type: 'teaser',
    label: ''
  },
  {
    id: 'contato', label: '',
    title: 'Identificamos desperdício na sua operação. Para ver o custo exato e as 3 ações de maior retorno:',
    desc: 'Deixe seus dados e desbloqueie o diagnóstico completo. Confidencial, sem spam.',
    type: 'text',
    fields: [
      { id: 'nome', placeholder: 'Como você prefere ser chamado?' },
      { id: 'empresa', placeholder: 'Nome da empresa' },
      { id: 'whatsapp', placeholder: 'WhatsApp com DDD (ex: 43 99999-0000)' }
    ]
  }
];

const echos = {
  horas_perdidas: [
    "Bom sinal. Mas mesmo 5h/semana representam mais de R$2.000/mês em custo invisível.",
    "Isso representa até R$8.000/mês em custo operacional escondido. A maioria das empresas não percebe.",
    "Atenção: sua equipe perde quase 2 dias inteiros por semana em rotinas braçais. Isso supera R$15.000/mês.",
    "Custo crítico. Acima de 30h semanais, o desperdício invisível supera o salário de um gestor sênior."
  ],
  dor: [
    "Processos manuais são a trava #1 de crescimento documentada no B2B. Você não está sozinho.",
    "Sistemas desconectados geram retrabalho infinito e furos graves de informação.",
    "Cada hora de TI parada custa em média R$480 para operações B2B desse porte.",
    "Decidir sem dados em tempo real é o que separa empresas que estagnam das que lideram.",
    "Sobrecarga operacional gera turnover alto. A automação resolve isso direto na raiz."
  ],
  faturamento: [
    null,
    "Nessa faixa, cada R$1.000 economizado vira lucro direto. Automação aqui tem ROI imediato.",
    "Com esse porte, ineficiências de 2% já representam dezenas de milhares perdidos por mês.",
    "Seu volume exige tecnologia robusta. Qualquer gargalo manual sangra em escala."
  ],
  janela_decisao: [
    "Perfeito. Vamos priorizar ações de impacto imediato para os próximos 7 dias.",
    "Ótimo timing. Dá para estruturar a implementação com controle e previsibilidade.",
    "Faz sentido. Vamos montar um plano de maturação para você avançar no momento certo.",
    "Entendemos. Mas enquanto você estuda, sua operação continua perdendo entre R$4k e R$15k/mês."
  ]
  // Nota: janela_decisao agora é exibida na tela de resultado
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
      el.style.setProperty('--delay', `${section._revealIdx * 100}ms`);
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

  // IMPACT STAT COUNTERS — animate -40%, +15h, 67% from zero
  const impactStats = document.querySelectorAll('.impact-big[data-value]');
  if (impactStats.length && !prefersReducedMotion) {
    const animateImpactCounter = (el) => {
      const rawValue = parseFloat(el.dataset.value);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const isNegative = rawValue < 0;
      const absTarget = Math.abs(rawValue);
      const duration = 1800;
      const start = performance.now();

      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-expo
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(absTarget * eased);
        el.textContent = (isNegative ? '-' : prefix) + current + suffix;
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = (isNegative ? '-' : prefix) + absTarget + suffix;
      };
      requestAnimationFrame(update);
    };

    const impactObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateImpactCounter(entry.target);
          impactObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    impactStats.forEach(el => impactObserver.observe(el));
  }

  // HERO DASHBOARD COUNTER ANIMATION
  const dashCounters = document.querySelectorAll('.dash-counter');
  if (dashCounters.length) {
    setTimeout(() => {
      dashCounters.forEach(el => {
        const target = parseInt(el.dataset.to);
        const isPrice = el.textContent.includes('R$');
        const duration = 2000;
        const start = performance.now();
        const update = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          if (isPrice) {
            el.textContent = `R$ ${current.toLocaleString('pt-BR')}`;
          } else {
            el.textContent = current.toLocaleString('pt-BR');
          }
          if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
      });
    }, 800);
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
  if (closeBtn) closeBtn.addEventListener('click', closeQuiz);

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

  if (quizOverlay) {
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
                       <a href="https://wa.me/${CONFIG.whatsappNumber}" target="_blank" class="btn-primary" style="display:inline-flex;">Continuar via WhatsApp</a>
                     </div>`;
        }
      }, 4000);
    }
  }

  if (currentStep === -1) renderIntro(); else renderStep();
}

function closeQuiz() {
  const quizOverlay = document.getElementById('quiz-overlay');
  if (quizOverlay) {
    quizOverlay.classList.remove('open');
    quizOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  if (currentStep >= QUESTIONS.length) sessionStorage.removeItem('bgtech_quiz');
}

function renderIntro() {
  const body = document.getElementById('quiz-body');
  const progressFill = document.getElementById('quiz-progress-fill');
  if (progressFill) progressFill.style.width = '0%';

  body.innerHTML = `
    <div class="quiz-intro reveal visible">
      <h2 style="color: var(--text-1);">O Diagnóstico BG Tech</h2>

      <div class="intro-social-proof">
        <span><i data-lucide="check-circle" width="16"></i> Diagnóstico 100% gratuito</span>
        <span><i data-lucide="check-circle" width="16"></i> Resultado em menos de 3 minutos</span>
        <span><i data-lucide="check-circle" width="16"></i> Sem compromisso</span>
      </div>
      <p style="color: var(--text-3);">Nos próximos 3 minutos você vai descobrir exatamente quanto dinheiro sua empresa está perdendo por mês e o porquê.</p>
      <p style="color: var(--text-3);">Não é estimativa genérica. É um cálculo baseado no perfil real da sua operação.</p>
      
      <p class="intro-pain-line">Se sua equipe ainda depende de planilha, ligação manual ou "copia e cola" para operar — cada dia parado tem um custo real. Vamos calcular juntos.</p>

      <div class="quiz-intro-hint">
        Seja completamente honesto. Quanto mais preciso você for nas respostas, mais exato será o resultado.
      </div>
      <button class="btn-primary btn-large js-start-quiz" style="width: 100%;">Estou pronto <i data-lucide="arrow-right"></i></button>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const startBtn = body.querySelector('.js-start-quiz');
  if (startBtn) startBtn.addEventListener('click', () => { nextStep(); });
}

function renderStep() {
  const q = QUESTIONS[currentStep];
  const body = document.getElementById('quiz-body');
  const bar = document.getElementById('quiz-progress-fill');

  if (bar) {
    if (q.id === 'contato') {
      bar.style.width = '80%';
      bar.classList.add('pulse-progress');
    } else {
      bar.style.width = `${(currentStep / (QUESTIONS.length - 1)) * 100}%`;
      bar.classList.remove('pulse-progress');
    }
  }

  if (q.type === 'teaser') {
    const matI = answers.maturidade ?? 2;
    const horasI = answers.horas_perdidas ?? 1;
    const fatI = answers.faturamento ?? 1;

    let partialScore = 38;
    if (matI === 1) partialScore = 52;
    if (matI === 2) partialScore = 61;
    if (matI === 3) partialScore = 78;
    if (matI === 4) partialScore = 92;
    if (horasI >= 2) partialScore = Math.max(35, partialScore - 8);

    const tScoreLabels = [
      { max: 40, label: 'Operação em Risco', color: '#ef4444' },
      { max: 60, label: 'Alerta Crítico', color: '#f97316' },
      { max: 75, label: 'Em Transição', color: '#eab308' },
      { max: 88, label: 'Estruturado', color: '#3b82f6' },
      { max: 100, label: 'Alta Performance', color: '#10b981' },
    ];
    const tScoreCat = tScoreLabels.find(s => partialScore <= s.max);
    const tCircleOffset = 251 - (251 * (partialScore / 100));

    let minL = 4200, maxL = 8500;
    if (fatI === 1) { minL = 14500; maxL = 22000; }
    if (fatI === 2) { minL = 28500; maxL = 42000; }
    if (fatI === 3) { minL = 65000; maxL = 98000; }
    const blurRange = `R$ ${(minL / 1000).toFixed(0)}k a R$ ${(maxL / 1000).toFixed(0)}k`;

    body.innerHTML = `
      <div class="reveal visible" style="text-align: center;">
        <span class="q-label">ANÁLISE CONCLUÍDA</span>
        <h2 class="q-title" style="margin-bottom: 8px;">Analisamos 5 pontos da sua operação.</h2>
        <p class="q-desc" style="margin-bottom: 24px;">Seu score de maturidade está calculado. O custo invisível está pronto.</p>

        <div class="score-banner" style="margin-bottom: 24px;">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle class="score-track" cx="50" cy="50" r="40"></circle>
              <circle class="score-fill" id="teaser-circle" cx="50" cy="50" r="40"
                style="stroke-dasharray: 251; stroke-dashoffset: 251; stroke: ${tScoreCat.color};"></circle>
            </svg>
            <div class="score-number">
              <span class="score-val">${partialScore}</span>
              <span class="score-max">/100</span>
            </div>
          </div>
          <div class="score-text">
            <span style="font-size: 13px; color: var(--text-3);">Maturidade Operacional</span>
            <span class="score-category" style="color: ${tScoreCat.color};">${tScoreCat.label}</span>
          </div>
        </div>

        <div class="teaser-locked-box">
          <div class="teaser-lock-header">
            <i data-lucide="lock" style="width: 22px; height: 22px; color: var(--blue);"></i>
            <span>Custo Invisível Estimado</span>
          </div>
          <div class="teaser-blur-value">${blurRange} /mês</div>
          <p class="teaser-unlock-hint">Desbloqueie para ver o número exato e as 3 ações prioritárias</p>
        </div>

        <button class="btn-primary btn-large btn-shimmer" id="teaser-unlock-btn" style="width: 100%; margin-bottom: 12px;">
          Ver diagnóstico completo <i data-lucide="unlock" width="18"></i>
        </button>
        <p style="font-size: 12px; color: var(--text-3); margin-bottom: 20px;">Sem compromisso · 100% confidencial · Sem spam</p>

        <div class="q-nav"><button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button></div>
      </div>
    `;

    setTimeout(() => {
      const tCirc = document.getElementById('teaser-circle');
      if (tCirc) {
        tCirc.style.transition = 'stroke-dashoffset 1.2s ease-out';
        tCirc.style.strokeDashoffset = tCircleOffset;
      }
    }, 100);

    document.getElementById('teaser-unlock-btn')?.addEventListener('click', () => nextStep());
    body.querySelector('.js-prev')?.addEventListener('click', () => { currentStep--; renderStep(); });
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
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
    if (q.badge) html += `<div class="q-badge-exclusive" style="display:none;"><i data-lucide="shield-check" width="14"></i> ${q.badge}</div>`;
    if (currentStep > 0) html += `<div class="q-nav"><button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button></div>`;
    html += `</div>`;
    body.innerHTML = html;

    body.querySelectorAll('.q-option').forEach(opt => {
      opt.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'));
        answers[q.id] = idx;
        const ecoText = echos[q.id]?.[idx];

        // GAP 2: Show badge only for R$200k+ (index >= 2)
        if (q.badge) {
          const badge = body.querySelector('.q-badge-exclusive');
          if (badge) {
            if (idx >= 2) {
              badge.style.display = 'flex';
              badge.style.animation = 'fadeInUp 0.3s ease forwards';
            } else {
              badge.style.display = 'none';
            }
          }
        }

        if (q.id === 'segmento') {
          const segName = q.options[idx].title;
          body.innerHTML = `<div class="micro-validation"><i data-lucide="check-circle-2" style="margin-bottom:12px;width:32px;height:32px;"></i><br>Calibrando diagnóstico para ${segName}...</div>`;
          if (typeof lucide !== 'undefined') lucide.createIcons();
          setTimeout(() => { nextStep(); }, 1200);
        } else if (ecoText) {
          const isWarning = q.id === 'janela_decisao' && idx === 3;
          body.innerHTML = `
            <div class="micro-validation" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 60px 20px;">
              <i data-lucide="${isWarning ? 'alert-triangle' : 'zap'}" style="color:${isWarning ? '#f59e0b' : 'var(--blue)'}; width: 48px; height: 48px; margin-bottom: 24px; animation: pulse 2s infinite;"></i>
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
      const inputType = f.id === 'whatsapp' ? 'tel' : 'text';
      const inputMode = f.id === 'whatsapp' ? ' inputmode="numeric"' : '';
      const autoCompleteMap = { nome: 'name', empresa: 'organization', whatsapp: 'tel' };
      const autoComplete = autoCompleteMap[f.id] || 'off';
      html += `<div class="q-input-group">
                <input type="${inputType}"${inputMode} class="q-input" id="inp-${f.id}" placeholder="${f.placeholder}" autocomplete="${autoComplete}" value="${textData[f.id] || ''}">
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
    if (wppInput) {
      wppInput.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
        this.value = v;
        this.classList.remove('error');
        document.getElementById('err-whatsapp').style.display = 'none';
      });
    }

    const nextBtn = body.querySelector('.js-next');
    if (nextBtn) {
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
      if (f.id !== 'whatsapp') {
        const inputEl = document.getElementById(`inp-${f.id}`);
        if (inputEl) {
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
  if (bar) {
    bar.classList.remove('pulse-progress');
    bar.style.width = '100%';
  }
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
    { icon: 'activity', text: 'Priorizando automações com maior retorno imediato...' },
    { icon: 'target', text: 'Priorizando automações com maior retorno...' },
    { icon: 'file-check-2', text: 'Montando plano executivo...' }
  ];

  body.innerHTML = `
    <div class="diag-loading reveal visible">
      <div class="diag-loading-ring"></div>
      <h2 class="q-title" style="margin-bottom: 32px;">Compilando o diagnóstico da ${textData.empresa || 'sua empresa'}...</h2>
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
  const nome = (textData.nome || 'Você').split(' ')[0];
  const empresa = textData.empresa || 'sua empresa';

  const fatIndex = answers.faturamento;
  const matIndex = answers.maturidade;
  const horasIndex = answers.horas_perdidas;
  const dorIndex = answers.dor;
  // janela_decisao será coletada na tela de resultado; default neutro
  const decIndex = answers.janela_decisao ?? 1;

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

  const scoreLabels = [
    { max: 40, label: 'Operação em Risco', color: '#ef4444' },
    { max: 60, label: 'Alerta Crítico', color: '#f97316' },
    { max: 75, label: 'Em Transição', color: '#eab308' },
    { max: 88, label: 'Estruturado', color: '#3b82f6' },
    { max: 100, label: 'Alta Performance', color: '#10b981' },
  ];
  const scoreCat = scoreLabels.find(s => score <= s.max);
  const circleOffset = 251 - (251 * (score / 100));

  // Percentil comparativo baseado no score
  const percentileText = score < 50
    ? `Você está <strong>abaixo de 78% das empresas</strong> do seu segmento em maturidade operacional.`
    : score < 70
      ? `Você está <strong>abaixo de 55% das empresas</strong> do seu segmento em maturidade operacional.`
      : score < 85
        ? `Você está <strong>acima de 60% das empresas</strong> do seu segmento — ainda há espaço relevante para crescer.`
        : `Você está <strong>no top 15% das empresas</strong> do seu segmento em maturidade operacional.`;

  const leadTemperature = (() => {
    if (fatIndex >= 2 && horasIndex >= 1) return 'Quente';
    if (fatIndex >= 1 || horasIndex >= 2) return 'Morno';
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

      <div class="result-scarcity">
        <span class="scarcity-dot"></span>
        <span>Diagnóstico gerado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ID: ${diagnosticId}</span>
      </div>

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

      <p class="result-percentile">${percentileText}</p>

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

      <div class="diagnostic-id">ID do Diagnóstico: <strong>${diagnosticId}</strong></div>

      <div class="result-janela-section">
        <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-1); margin-bottom: 16px;">
          Agora que você viu os números: quando você quer agir?
        </h3>
        <div class="janela-opts-grid">
          <button class="janela-opt-btn" data-dec="0" data-echo="Perfeito. Vamos priorizar ações de impacto imediato para os próximos 7 dias.">
            <strong>Nos próximos 7 dias</strong><span>Preciso de resultado rápido</span>
          </button>
          <button class="janela-opt-btn" data-dec="1" data-echo="Ótimo timing. Dá para estruturar a implementação com controle e previsibilidade.">
            <strong>Em 15 a 30 dias</strong><span>Quero organizar internamente primeiro</span>
          </button>
          <button class="janela-opt-btn" data-dec="2" data-echo="Faz sentido. Vamos montar um plano de maturação para você avançar no momento certo.">
            <strong>Em 1 a 3 meses</strong><span>Estou validando cenário e prioridade</span>
          </button>
          <button class="janela-opt-btn" data-dec="3" data-echo="Entendemos. Mas enquanto você estuda, sua operação continua perdendo entre R$4k e R$15k/mês.">
            <strong>Só estudando por enquanto</strong><span>Quero entender melhor antes de decidir</span>
          </button>
        </div>
        <div class="janela-echo-msg" id="janela-echo-msg" style="display: none;"></div>
      </div>

      <div class="result-cta-primary">
        <div class="cta-primary-icon"><i data-lucide="phone-call" width="22"></i></div>
        <div class="cta-primary-text">
          <strong>Um especialista BG Tech vai te chamar</strong>
          <span id="result-sla-copy">${slaCopy}</span>
        </div>
        <div class="cta-primary-check">✓</div>
      </div>

      <div class="result-timeline-visual">
        <div class="tl-v-item">
          <span class="tl-v-time">Agora</span>
          <span class="tl-v-dot active"></span>
          <span class="tl-v-label">Diagnóstico processado</span>
        </div>
        <div class="tl-v-item">
          <span class="tl-v-time">~20min</span>
          <span class="tl-v-dot"></span>
          <span class="tl-v-label">Especialista entra em contato</span>
        </div>
        <div class="tl-v-item">
          <span class="tl-v-time">Hoje</span>
          <span class="tl-v-dot"></span>
          <span class="tl-v-label">Plano personalizado na sua mão</span>
        </div>
      </div>

      <button class="result-cta-secondary" id="btn-wpp-now">Prefere falar agora? → Abrir WhatsApp</button>

      <p style="font-size: 12px; color: var(--text-3); text-align: center; margin-top: 8px; opacity: 0.7;">Sem compromisso · 100% confidencial · Sem spam</p>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Hide progress bar on result screen
  const bar = document.getElementById('quiz-progress-fill');
  if (bar) bar.parentElement.style.display = 'none';

  // Animate score circle and opportunity bars
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

  // Janela de decisão pós-resultado
  const janelaTitles = ['Quero agir nos próximos 7 dias', 'Em 15 a 30 dias', 'Em 1 a 3 meses', 'Só estudando por enquanto'];
  document.querySelectorAll('.janela-opt-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const decIdx = parseInt(this.dataset.dec);
      const echo = this.dataset.echo;
      answers.janela_decisao = decIdx;

      document.querySelectorAll('.janela-opt-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');

      const echoEl = document.getElementById('janela-echo-msg');
      if (echoEl) { echoEl.textContent = echo; echoEl.style.display = 'block'; }

      const slaEl = document.getElementById('result-sla-copy');
      if (slaEl) {
        slaEl.textContent = decIdx === 0
          ? 'Atendimento prioritário: nossa equipe entra em contato em até 20 minutos.'
          : decIdx <= 1
            ? 'Atendimento recomendado: retorno da equipe em até 2 horas úteis.'
            : 'Você pode receber o plano e avançar no seu timing com suporte consultivo.';
      }

      if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
        fetch(`${CONFIG.supabaseUrl}/rest/v1/leads?diagnostico_id=eq.${diagnosticId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ janela_decisao: janelaTitles[decIdx] })
        }).catch(err => console.error('❌ Erro ao atualizar janela:', err));
      }
    });
  });

  // Secondary WhatsApp CTA
  document.getElementById('btn-wpp-now')?.addEventListener('click', () => {
    const msg = `Olá! Fiz o diagnóstico da BG Tech (ID ${diagnosticId}). Score ${score}/100, custo estimado de ${lostValueStr}/mês em ineficiências. Quero conversar sobre o plano para ${empresa}.`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // ── Data collection ──────────────────────────────────────
  const segOpt = QUESTIONS[0].options[answers.segmento];
  const horasOpt = QUESTIONS[1].options[answers.horas_perdidas];
  const dorOpt = QUESTIONS[2].options[answers.dor];
  const fatOpt = QUESTIONS[3].options[answers.faturamento];
  const matOpt = QUESTIONS[4].options[answers.maturidade];

  // Payload do LEAD — apenas colunas que existem na tabela leads
  const leadPayload = {
    nome: textData.nome,
    empresa: textData.empresa || 'sua empresa',
    telefone: textData.whatsapp.replace(/\D/g, ''),
    whatsapp: textData.whatsapp.replace(/\D/g, ''),
    setor: segOpt ? segOpt.title : '',
    origem: getOrigem(),
    status: 'novo',
    valor_estimado: maxLoss,
    temperatura: leadTemperature.toLowerCase(),
    responsavel: 'Bryan',
    diagnostico_id: diagnosticId,
    notas: `Score: ${score}/100 | Custo: R$ ${(minLoss/1000).toFixed(0)}k-${(maxLoss/1000).toFixed(0)}k/mês | Dor: ${dorOpt ? dorOpt.title : 'N/A'} | Horas perdidas: ${horasOpt ? horasOpt.title : 'N/A'} | Maturidade: ${matOpt ? matOpt.title : 'N/A'} | Faturamento: ${fatOpt ? fatOpt.title : 'N/A'}`
  };

  // Payload da QUIZ_SESSION — dados detalhados do quiz
  const quizSessionPayload = {
    setor: segOpt ? segOpt.title : '',
    faturamento_faixa: fatOpt ? fatOpt.title : '',
    horas_retrabalho: horasOpt ? horasOpt.title : '',
    gargalos: dorOpt ? [dorOpt.title] : [],
    nivel_tecnologia: matOpt ? matOpt.title : '',
    respostas: JSON.stringify({ answers, textData }),
    score_automacao: score,
    custo_invisivel_min: minLoss,
    custo_invisivel_max: maxLoss,
    resultado_tipo: matOpt && matOpt.title === 'Tecnologia boa, preciso de parceiro' ? 'parceria' : 'diagnostico',
    utm_source: getUTM('utm_source'),
    utm_medium: getUTM('utm_medium'),
    utm_campaign: getUTM('utm_campaign'),
    utm_content: getUTM('utm_content'),
    origem: getOrigem(),
    completed_at: new Date().toISOString()
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
      empresa: textData.empresa || 'sua empresa',
      nome: textData.nome,
      whatsapp: textData.whatsapp,
      lead_temperature: leadTemperature,
      score,
      custo_mensal_estimado: `R$ ${(minLoss / 1000).toFixed(0)}k a R$ ${(maxLoss / 1000).toFixed(0)}k`,
      dor_principal: dorOpt ? dorOpt.title : '',
      segmento: segOpt ? segOpt.title : '',
      created_at: new Date().toISOString()
    };
    try {
      await postWebhook(runtimeWebhook.webhookUrl, hotLeadPayload, runtimeWebhook.webhookToken);
    } catch (err) {
      console.error('Erro ao notificar lead quente:', err);
    }
  };

  // ── Supabase: salvar lead + quiz_session ───────────────
  const supabaseHeaders = {
    'Content-Type': 'application/json',
    'apikey': CONFIG.supabaseKey,
    'Authorization': `Bearer ${CONFIG.supabaseKey}`
  };

  const saveToSupabase = async (attempt = 1) => {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
      // Sem config: salva fallback no sessionStorage
      sessionStorage.setItem('bgtech_quiz_offline', JSON.stringify({ leadPayload, quizSessionPayload, savedAt: Date.now() }));
      return;
    }

    try {
      // 1. Criar lead (com Prefer: return=representation para pegar o ID)
      const leadRes = await fetch(`${CONFIG.supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(leadPayload)
      });

      let leadId = null;
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        leadId = Array.isArray(leadData) ? leadData[0]?.id : leadData?.id;
      } else {
        throw new Error(`Lead HTTP ${leadRes.status}`);
      }

      // 2. Criar quiz_session vinculada ao lead
      const sessionData = { ...quizSessionPayload };
      if (leadId) sessionData.lead_id = leadId;

      const sessRes = await fetch(`${CONFIG.supabaseUrl}/rest/v1/quiz_sessions`, {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify(sessionData)
      });

      if (!sessRes.ok) {
        console.error('Quiz session HTTP', sessRes.status);
      }

      // Sucesso: limpa fallback se existia
      localStorage.removeItem('bgtech_lead_offline');
      sessionStorage.removeItem('bgtech_quiz_offline');

    } catch (err) {
      if (attempt < 3) {
        setTimeout(() => saveToSupabase(attempt + 1), attempt * 1500);
      } else {
        // Fallback: salva no localStorage para retry posterior
        localStorage.setItem('bgtech_lead_offline', JSON.stringify({ leadPayload, quizSessionPayload, savedAt: Date.now() }));
        console.error('Lead salvo offline apos 3 tentativas:', err);
      }
    }
  };

  // Tenta sync de lead offline anterior (ex: usuário voltou com conexão)
  const offlineLead = localStorage.getItem('bgtech_lead_offline');
  if (offlineLead && CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    try {
      const saved = JSON.parse(offlineLead);
      // Suporta formato antigo (payload direto) e novo (leadPayload + quizSessionPayload)
      if (saved.leadPayload) {
        fetch(`${CONFIG.supabaseUrl}/rest/v1/leads`, {
          method: 'POST',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify(saved.leadPayload)
        }).then(r => { if (r.ok) localStorage.removeItem('bgtech_lead_offline'); })
          .catch(() => {});
      }
    } catch (_) { localStorage.removeItem('bgtech_lead_offline'); }
  }

  saveToSupabase();

  if (leadTemperature === 'Quente') {
    notifyHotLead('resultado_quiz');
  }
}

// ============================================
// SCROLL ANIMATION SYSTEM — BG TECH
// ============================================
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('[data-anim]').forEach(el => {
    observer.observe(el);
  });
})();

// ============================================
// HERO PARALLAX (desktop only)
// ============================================
(function initHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero || window.innerWidth < 768) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const rate = window.scrollY * 0.3;
        hero.style.setProperty('--parallax-y', `${rate}px`);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ============================================
// HERO DASHBOARD — animated counters + cycling notifications
// ============================================
(function initHeroDashboard() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // --- Animated counters for stat cards ---
  const statDefs = [
    { selector: '.dash-stat-card:nth-child(1) .dash-stat-value', from: 0, to: 47800, prefix: 'R$ ', suffix: '', format: v => `R$ ${Math.round(v).toLocaleString('pt-BR')}` },
    { selector: '.dash-stat-card:nth-child(2) .dash-stat-value', from: 0, to: 312,   prefix: '',    suffix: 'h', format: v => `${Math.round(v)}h` },
    { selector: '.dash-stat-card:nth-child(3) .dash-stat-value', from: 12, to: 4,    prefix: '',    suffix: ' min', format: v => `${Math.round(v)} min` }
  ];

  function animateStatCounter(el, def, delay) {
    setTimeout(() => {
      const duration = 1800;
      const start = performance.now();
      const range = def.to - def.from;
      const update = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = def.format(def.from + range * eased);
        if (p < 1) requestAnimationFrame(update);
        else {
          el.textContent = def.format(def.to);
          el.classList.add('updating');
          setTimeout(() => el.classList.remove('updating'), 900);
        }
      };
      requestAnimationFrame(update);
    }, delay);
  }

  setTimeout(() => {
    statDefs.forEach((def, i) => {
      const el = document.querySelector(def.selector);
      if (el) animateStatCounter(el, def, i * 200);
    });
  }, 800);

  // --- Cycling notification events ---
  const events = [
    { icon: '⚡', title: 'Lead qualificado', sub: 'Distribuído em 12s' },
    { icon: '📄', title: 'Proposta gerada', sub: 'Automação ativa' },
    { icon: '✅', title: 'Follow-up enviado', sub: 'CRM atualizado' },
    { icon: '🔔', title: 'Lead respondeu', sub: 'Agendamento confirmado' },
    { icon: '💰', title: 'Fechamento registrado', sub: 'ROI calculado' },
    { icon: '⚙️', title: 'Integração sincronizada', sub: 'ERP + CRM ok' },
  ];

  const notifs = document.querySelectorAll('.dash-notif');
  if (!notifs.length) return;

  let eventIdx = 0;
  function cycleNotif(notifEl) {
    eventIdx = (eventIdx + 1) % events.length;
    const ev = events[eventIdx];
    const iconEl = notifEl.querySelector('.dash-notif-icon');
    const titleEl = notifEl.querySelector('.dash-notif-text strong');
    const subEl = notifEl.querySelector('.dash-notif-text span');
    if (iconEl) iconEl.textContent = ev.icon;
    if (titleEl) titleEl.textContent = ev.title;
    if (subEl) subEl.textContent = ev.sub;
    notifEl.classList.remove('flash');
    void notifEl.offsetWidth; // reflow to restart animation
    notifEl.classList.add('flash');
    setTimeout(() => notifEl.classList.remove('flash'), 700);
  }

  // Start cycling after initial animations complete
  setTimeout(() => {
    setInterval(() => cycleNotif(notifs[0]), 3500);
    setTimeout(() => setInterval(() => cycleNotif(notifs[1]), 4200), 1800);
  }, 4000);

})();

// ============================================
// STAGGER automático em grids ao entrar na viewport
// ============================================
(function initGridStagger() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gridSelectors = [
    '.problems-grid', '.services-grid', '.segments-grid',
    '.cases-grid', '.trust-bar-grid', '.founders-cards', '.process-steps'
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = entry.target.querySelectorAll('[data-anim]');
      children.forEach((child, i) => {
        child.style.setProperty('--stagger-i', i);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  gridSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => observer.observe(el));
  });
})();
