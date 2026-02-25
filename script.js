// ==========================================================================
// BG TECH | ENTERPRISE JAVASCRIPT ARCHITECTURE v2.0
// Módulos: Config, State, API, UI, Analytics
// ==========================================================================

'use strict';

// ==== MÓDULO DE CONFIGURAÇÃO ====
const CONFIG = Object.freeze({
  // NUNCA exponha chaves de API no frontend em produção!
  // Use variáveis de ambiente ou proxy server
  API: {
    SUPABASE_URL: 'https://urpuiznydrlwmaqhdids.supabase.co',
    SUPABASE_KEY: 'sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0', // ⚠️ Mover para backend!
    WEBHOOK_URL: null, // Implementar endpoint seguro
    TIMEOUT: 8000,
    RETRY_ATTEMPTS: 3
  },
  
  WHATSAPP: {
    NUMBER: '5511999998888',
    MESSAGE_TEMPLATE: 'Olá! Fiz o diagnóstico da BG Tech. Score {score}/100. Quero agendar a conversa para {empresa}.'
  },
  
  UI: {
    ANIMATION_DURATION: 300,
    SCROLL_OFFSET: 80,
    DEBOUNCE_DELAY: 16, // ~60fps
    COUNTER_DURATION: 1800
  },
  
  QUIZ: {
    STORAGE_KEY: 'bgtech_quiz_v2',
    EXPIRY_HOURS: 24,
    MAX_STEPS: 6
  }
});

// ==== MÓDULO DE ESTADO (State Management) ====
class QuizState {
  constructor() {
    this.data = {
      currentStep: -1,
      answers: {},
      textData: {},
      metadata: {
        startedAt: null,
        completedAt: null,
        location: null,
        device: navigator.userAgent,
        referrer: document.referrer
      }
    };
    this.listeners = new Set();
    this.load();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.data));
  }

  save() {
    try {
      const payload = {
        ...this.data,
        savedAt: new Date().toISOString()
      };
      sessionStorage.setItem(CONFIG.QUIZ.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage não disponível:', e);
    }
  }

  load() {
    try {
      const saved = sessionStorage.getItem(CONFIG.QUIZ.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hoursSince = (Date.now() - new Date(parsed.savedAt)) / 36e5;
        
        if (hoursSince < CONFIG.QUIZ.EXPIRY_HOURS) {
          this.data = { ...this.data, ...parsed };
          return true;
        } else {
          this.clear();
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar estado:', e);
    }
    return false;
  }

  clear() {
    sessionStorage.removeItem(CONFIG.QUIZ.STORAGE_KEY);
    this.data = {
      currentStep: -1,
      answers: {},
      textData: {},
      metadata: { ...this.data.metadata }
    };
    this.notify();
  }

  setStep(step) {
    this.data.currentStep = step;
    if (step === 0 && !this.data.metadata.startedAt) {
      this.data.metadata.startedAt = new Date().toISOString();
    }
    this.save();
    this.notify();
  }

  setAnswer(questionId, value) {
    this.data.answers[questionId] = value;
    this.save();
  }

  setTextData(fieldId, value) {
    this.data.textData[fieldId] = value;
    this.save();
  }

  getProgress() {
    return ((this.data.currentStep + 1) / CONFIG.QUIZ.MAX_STEPS) * 100;
  }

  isComplete() {
    return this.data.currentStep >= QUESTIONS.length - 1;
  }
}

// ==== MÓDULO DE API (Com retry e Circuit Breaker) ====
class APIService {
  constructor() {
    this.circuitOpen = false;
    this.failureCount = 0;
    this.failureThreshold = 3;
    this.resetTimeout = 30000;
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async saveLead(payload, attempt = 1) {
    if (this.circuitOpen) {
      console.warn('Circuit breaker aberto. Salvando localmente.');
      this.saveLocalBackup(payload);
      return { success: false, cached: true };
    }

    try {
      // ⚠️ EM PRODUÇÃO: Mover para Edge Function/Serverless
      const response = await this.fetchWithTimeout(
        `${CONFIG.API.SUPABASE_URL}/rest/v1/leads`,
        {
          method: 'POST',
          headers: {
            'apikey': CONFIG.API.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.API.SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            ...payload,
            created_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_size: `${window.innerWidth}x${window.innerHeight}`
          })
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.failureCount = 0;
      return { success: true };
      
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou:`, error);
      
      if (attempt < CONFIG.API.RETRY_ATTEMPTS) {
        await this.delay(1000 * attempt);
        return this.saveLead(payload, attempt + 1);
      }
      
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.openCircuit();
      }
      
      this.saveLocalBackup(payload);
      return { success: false, error: error.message };
    }
  }

  saveLocalBackup(payload) {
    const backups = JSON.parse(localStorage.getItem('bgtech_pending_leads') || '[]');
    backups.push({ ...payload, timestamp: Date.now() });
    localStorage.setItem('bgtech_pending_leads', JSON.stringify(backups));
  }

  openCircuit() {
    this.circuitOpen = true;
    setTimeout(() => {
      this.circuitOpen = false;
      this.failureCount = 0;
    }, this.resetTimeout);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getLocation() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return data.city || 'sua região';
    } catch {
      return 'sua região';
    }
  }
}

// ==== MÓDULO DE UI (Interações e Animações) ====
class UIManager {
  constructor(state, api) {
    this.state = state;
    this.api = api;
    this.elements = {};
    this.observers = new Map();
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.initObservers();
    this.initLucide();
  }

  cacheElements() {
    this.elements = {
      header: document.getElementById('site-header'),
      progressBar: document.getElementById('reading-progress'),
      mobileMenu: document.getElementById('mobile-menu'),
      quizOverlay: document.getElementById('quiz-overlay'),
      quizBody: document.getElementById('quiz-body'),
      quizProgress: document.getElementById('quiz-progress-fill')
    };
  }

  bindEvents() {
    // Debounced scroll handler
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Mobile menu
    document.querySelector('.js-toggle-menu')?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    document.querySelectorAll('.js-close-menu').forEach(btn => {
      btn.addEventListener('click', () => this.closeMobileMenu());
    });

    // Quiz triggers
    document.querySelectorAll('.js-open-quiz').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openQuiz();
      });
    });

    document.querySelector('.js-close-quiz')?.addEventListener('click', () => {
      this.closeQuiz();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeQuiz();
    });

    // Close on backdrop click
    this.elements.quizOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.quizOverlay) this.closeQuiz();
    });
  }

  handleScroll() {
    const { scrollY } = window;
    const { header, progressBar } = this.elements;
    
    // Header state
    if (scrollY > 50) {
      header?.classList.add('header--scrolled');
    } else {
      header?.classList.remove('header--scrolled');
    }

    // Reading progress
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0 && progressBar) {
      progressBar.style.width = `${(scrollY / docHeight) * 100}%`;
    }
  }

  initObservers() {
    // Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Trigger process line animation
          if (entry.target.classList.contains('process-steps')) {
            setTimeout(() => {
              document.getElementById('process-line')?.style.setProperty('width', '100%');
            }, 500);
          }
          
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Counter animations
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));
  }

  animateCounter(element) {
    const target = parseFloat(element.dataset.target);
    const isFloat = element.dataset.target.includes('.');
    const duration = CONFIG.UI.COUNTER_DURATION;
    let startTime = null;

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOutQuart(progress);
      const current = target * eased;
      
      element.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    };

    requestAnimationFrame(step);
  }

  toggleMobileMenu() {
    this.elements.mobileMenu?.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  }

  closeMobileMenu() {
    this.elements.mobileMenu?.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  openQuiz() {
    this.state.load();
    this.elements.quizOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (this.state.data.currentStep === -1) {
      this.renderIntro();
    } else {
      this.renderStep();
    }
  }

  closeQuiz() {
    this.elements.quizOverlay?.classList.remove('active');
    document.body.style.overflow = '';
    
    if (this.state.isComplete()) {
      this.state.clear();
    }
  }

  initLucide() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  refreshIcons() {
    this.initLucide();
  }
}

// ==== MÓDULO DO QUIZ (Lógica de Negócio) ====
class QuizManager {
  constructor(state, api, ui) {
    this.state = state;
    this.api = api;
    this.ui = ui;
    this.questions = QUESTIONS;
    this.echos = ECHOS;
    this.location = 'sua região';
    this.init();
  }

  async init() {
    this.location = await this.api.getLocation();
  }

  renderIntro() {
    const body = this.ui.elements.quizBody;
    if (!body) return;

    body.innerHTML = `
      <div class="quiz-intro reveal visible">
        <h2 style="font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--color-slate-900); margin-bottom: 24px; line-height: 1.3;">
          O Diagnóstico BG Tech
        </h2>
        
        <div class="intro-social-proof" style="display: flex; justify-content: center; gap: 24px; font-size: 13px; color: var(--color-slate-500); margin-bottom: 32px; font-weight: 600; background: var(--color-slate-100); padding: 16px; border-radius: 12px; border: 1px solid var(--color-slate-200); flex-wrap: wrap;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="check-circle" style="width: 16px; height: 16px; color: var(--color-emerald-500);"></i> 
            847 empresas diagnosticadas
          </span>
          <span style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="clock" style="width: 16px; height: 16px; color: var(--color-electric-500);"></i> 
            Resultado em 3 minutos
          </span>
        </div>

        <p style="color: var(--color-slate-600); font-size: 16px; line-height: 1.7; margin-bottom: 16px;">
          Nos próximos 3 minutos você vai descobrir exatamente quanto dinheiro sua empresa está perdendo por mês.
        </p>
        <p style="color: var(--color-slate-600); font-size: 16px; line-height: 1.7; margin-bottom: 32px;">
          Não é estimativa genérica. É um cálculo baseado no perfil real da sua operação.
        </p>
        
        <div style="background: rgba(0, 168, 255, 0.05); border: 1px solid rgba(0, 168, 255, 0.15); padding: 16px; border-radius: 12px; margin-bottom: 32px; font-size: 14px; color: var(--color-electric-600); font-weight: 600;">
          <i data-lucide="info" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>
          Seja completamente honesto. Quanto mais preciso você for, mais exato será o resultado.
        </div>
        
        <button class="btn btn-primary btn-shimmer js-start-quiz" style="width: 100%; padding: 18px; font-size: 16px;">
          Estou pronto 
          <i data-lucide="arrow-right" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
    `;
    
    this.ui.refreshIcons();
    
    body.querySelector('.js-start-quiz')?.addEventListener('click', () => {
      this.nextStep();
    });
  }

  renderStep() {
    const q = this.questions[this.state.data.currentStep];
    const body = this.ui.elements.quizBody;
    const progress = this.ui.elements.quizProgress;
    
    if (!body || !q) return;

    // Update progress
    const percent = this.state.getProgress();
    if (progress) {
      progress.style.width = `${percent}%`;
      if (q.id === 'contato') {
        progress.classList.add('pulse-progress');
      } else {
        progress.classList.remove('pulse-progress');
      }
    }

    if (q.type === 'options') {
      this.renderOptionsQuestion(q, body);
    } else {
      this.renderContactForm(q, body);
    }
  }

  renderOptionsQuestion(question, container) {
    let html = `
      <div class="reveal visible">
        <span class="q-label" style="font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--color-electric-600); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; display: block;">
          ${question.label}
        </span>
        <h2 class="q-title" style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--color-slate-900); margin-bottom: 12px; line-height: 1.3;">
          ${question.title}
        </h2>
        <p class="q-desc" style="font-size: 15px; color: var(--color-slate-500); margin-bottom: 32px; line-height: 1.6;">
          ${question.desc}
        </p>
        <div class="q-options" style="display: flex; flex-direction: column; gap: 12px;">
    `;

    question.options.forEach((opt, i) => {
      const isSelected = this.state.data.answers[question.id] === i;
      const iconColor = opt.iconColor ? opt.iconColor.replace('icon-', 'color: ') : '';
      
      html += `
        <div class="quiz-option ${isSelected ? 'selected' : ''}" data-index="${i}" style="display: flex; align-items: center; gap: 16px; padding: 20px; border: 2px solid ${isSelected ? 'var(--color-electric-500)' : 'var(--color-slate-200)'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isSelected ? 'rgba(0,168,255,0.05)' : 'white'};">
          <div class="q-icon" style="width: 40px; height: 40px; background: var(--color-slate-100); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--color-slate-500); ${iconColor}">
            <i data-lucide="${opt.icon}" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="q-text" style="flex: 1;">
            <strong style="display: block; font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--color-slate-900); margin-bottom: 4px;">
              ${opt.title}
            </strong>
            <span style="font-size: 13px; color: var(--color-slate-500);">${opt.sub}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    
    if (this.state.data.currentStep > 0) {
      html += `
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--color-slate-200);">
          <button class="btn btn-ghost js-prev" style="color: var(--color-slate-500); font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> 
            Voltar
          </button>
        </div>
      `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    this.ui.refreshIcons();

    // Event listeners
    container.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        this.handleOptionSelect(question, idx);
      });
    });

    container.querySelector('.js-prev')?.addEventListener('click', () => {
      this.prevStep();
    });
  }

  renderContactForm(question, container) {
    const savedData = this.state.data.textData;
    
    let html = `
      <div class="reveal visible">
        <span class="q-label" style="display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--color-electric-600); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">
          <span class="live-dot" style="width: 8px; height: 8px; background: var(--color-emerald-500); border-radius: 50%; display: inline-block; animation: pulse 2s infinite;"></span>
          DIAGNÓSTICO PRONTO
        </span>
        <h2 class="q-title" style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--color-slate-900); margin-bottom: 12px; line-height: 1.3;">
          ${question.title}
        </h2>
        <p class="q-desc" style="font-size: 15px; color: var(--color-slate-500); margin-bottom: 32px; line-height: 1.6;">
          ${question.desc}
        </p>
    `;

    question.fields.forEach(f => {
      const value = savedData[f.id] || '';
      const isWhatsApp = f.id === 'whatsapp';
      
      html += `
        <div class="q-input-group" style="margin-bottom: 16px;">
          <input 
            type="text" 
            class="q-input" 
            id="inp-${f.id}" 
            placeholder="${f.placeholder}" 
            value="${value}"
            ${isWhatsApp ? 'inputmode="tel"' : ''}
            style="width: 100%; padding: 16px 20px; border: 2px solid var(--color-slate-200); border-radius: 12px; font-size: 15px; font-family: inherit; transition: all 0.2s; background: white; color: var(--color-slate-900);"
          >
          <div class="q-error-msg" id="err-${f.id}" style="color: #ef4444; font-size: 12px; font-weight: 600; margin-top: 8px; display: none;"></div>
        </div>
      `;
    });

    html += `
        <p style="font-size: 12px; color: var(--color-slate-400); margin: 24px 0; text-align: center;">
          <i data-lucide="shield" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i>
          Usamos esse contato apenas para enviar e debater o diagnóstico.
        </p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--color-slate-200);">
          <button class="btn btn-ghost js-prev" style="color: var(--color-slate-500); font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> 
            Voltar
          </button>
          <button class="btn btn-primary js-submit" style="padding: 16px 32px;">
            Liberar meu diagnóstico 
            <i data-lucide="unlock" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    this.ui.refreshIcons();

    // Mask WhatsApp input
    const wppInput = document.getElementById('inp-whatsapp');
    if (wppInput) {
      wppInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
        e.target.value = v;
        e.target.classList.remove('error');
        document.getElementById('err-whatsapp').style.display = 'none';
      });
    }

    // Clear errors on input
    question.fields.forEach(f => {
      if (f.id !== 'whatsapp') {
        document.getElementById(`inp-${f.id}`)?.addEventListener('input', (e) => {
          e.target.classList.remove('error');
          document.getElementById(`err-${f.id}`).style.display = 'none';
        });
      }
    });

    container.querySelector('.js-prev')?.addEventListener('click', () => this.prevStep());
    container.querySelector('.js-submit')?.addEventListener('click', () => this.handleSubmit());
  }

  handleOptionSelect(question, index) {
    this.state.setAnswer(question.id, index);
    
    const echoText = this.echos[question.id]?.[index];
    
    if (question.id === 'segmento') {
      this.showMicroValidation(`Calibrando diagnóstico para ${question.options[index].title}...`, 1200);
    } else if (echoText) {
      this.showMicroValidation(echoText, 2500, true);
    } else {
      this.nextStep();
    }
  }

  showMicroValidation(message, duration, isWarning = false) {
    const body = this.ui.elements.quizBody;
    const icon = isWarning ? 'zap' : 'check-circle-2';
    const color = isWarning ? 'var(--color-electric-500)' : 'var(--color-emerald-500)';
    
    body.innerHTML = `
      <div class="micro-validation" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 20px; animation: fadeIn 0.4s forwards;">
        <i data-lucide="${icon}" style="color: ${color}; width: 48px; height: 48px; margin-bottom: 24px; ${isWarning ? 'animation: pulse 2s infinite;' : ''}"></i>
        <p style="color: var(--color-slate-900); font-family: var(--font-display); font-size: 20px; font-weight: 700; line-height: 1.4; max-width: 400px;">
          ${message}
        </p>
      </div>
    `;
    this.ui.refreshIcons();
    
    setTimeout(() => this.nextStep(), duration);
  }

  handleSubmit() {
    const fields = [
      { id: 'nome', min: 3, msg: 'Insira um nome válido' },
      { id: 'empresa', min: 2, msg: 'Informe a empresa' },
      { id: 'whatsapp', min: 10, msg: 'Número inválido. Inclua o DDD.', max: 13 }
    ];

    let hasError = false;

    fields.forEach(f => {
      const el = document.getElementById(`inp-${f.id}`);
      const val = f.id === 'whatsapp' ? el.value.replace(/\D/g, '') : el.value.trim();
      const errEl = document.getElementById(`err-${f.id}`);
      
      if (val.length < f.min || (f.max && val.length > f.max)) {
        hasError = true;
        el.classList.add('error');
        el.style.borderColor = '#ef4444';
        errEl.textContent = f.msg;
        errEl.style.display = 'block';
      } else {
        this.state.setTextData(f.id, el.value.trim());
      }
    });

    if (!hasError) {
      this.runLoading();
    }
  }

  runLoading() {
    const body = this.ui.elements.quizBody;
    const progress = this.ui.elements.quizProgress;
    
    progress.style.width = '100%';
    progress.classList.remove('pulse-progress');

    const segName = this.questions[0].options[this.state.data.answers.segmento].title;
    const fatIndex = this.state.data.answers.faturamento;
    
    let basePerda = 6500;
    if (fatIndex === 1) basePerda = 14000;
    if (fatIndex === 2) basePerda = 32000;
    if (fatIndex === 3) basePerda = 65000;

    const steps = [
      { icon: 'briefcase', text: `Mapeando gargalos na área de ${segName}...` },
      { icon: 'search', text: `Cruzando dados com empresas em ${this.location}...` },
      { icon: 'dollar-sign', text: `Calculando horas perdidas e sangria financeira...`, showValue: true },
      { icon: 'target', text: 'Priorizando automações com maior retorno...' },
      { icon: 'file-check-2', text: 'Montando plano executivo...' }
    ];

    body.innerHTML = `
      <div class="diag-loading reveal visible" style="text-align: center; padding: 40px 20px;">
        <div style="width: 48px; height: 48px; border: 4px solid var(--color-slate-200); border-top-color: var(--color-electric-500); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 32px;"></div>
        <h2 style="font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--color-slate-900); margin-bottom: 32px;">
          Compilando o diagnóstico da ${this.state.data.textData.empresa}...
        </h2>
        <div style="display: flex; flex-direction: column; gap: 20px; max-width: 460px; margin: 0 auto; text-align: left;">
          ${steps.map((s, i) => `
            <div class="diag-step" id="step-${i}" style="display: flex; align-items: center; gap: 16px; opacity: 0.4; transition: all 0.3s;">
              <div style="color: var(--color-slate-400); transition: color 0.3s;">
                <i data-lucide="${s.icon}" style="width: 20px; height: 20px;"></i>
              </div>
              <div style="flex: 1;">
                <span style="color: var(--color-slate-600); font-weight: 600; font-size: 14px;">${s.text}</span>
                ${s.showValue ? `<div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: #ef4444; margin-top: 4px; opacity: 0; transition: opacity 0.5s;" id="partial-value">⚡ Estimativa parcial: <strong>R$ ${(basePerda * 0.8).toLocaleString('pt-BR')}</strong></div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    this.ui.refreshIcons();

    // Animate steps
    let i = 0;
    const animateStep = () => {
      if (i > 0) {
        const prev = document.getElementById(`step-${i - 1}`);
        if (prev) {
          prev.style.opacity = '1';
          prev.querySelector('div:first-child').style.color = 'var(--color-emerald-500)';
          prev.querySelector('div:first-child').innerHTML = '<i data-lucide="check" style="width: 20px; height: 20px;"></i>';
        }
      }
      
      if (i < steps.length) {
        const current = document.getElementById(`step-${i}`);
        if (current) {
          current.style.opacity = '1';
          current.querySelector('div:first-child').style.color = 'var(--color-electric-500)';
          
          if (steps[i].showValue) {
            setTimeout(() => {
              document.getElementById('partial-value').style.opacity = '1';
            }, 300);
          }
        }
        this.ui.refreshIcons();
        i++;
        setTimeout(animateStep, 1000);
      } else {
        setTimeout(() => this.showResults(), 500);
      }
    };
    
    animateStep();
  }

  async showResults() {
    const body = this.ui.elements.quizBody;
    const { textData, answers } = this.state.data;
    
    const nome = textData.nome.split(' ')[0];
    const empresa = textData.empresa;
    const dorPrincipal = this.questions[2].options[answers.dor].title;
    const segmento = this.questions[0].options[answers.segmento].title;
    
    const segTexts = {
      'Construção Civil': 'Sua construtora',
      'Jurídico e Contabilidade': 'Seu escritório',
      'Comércio e Varejo': 'Sua operação',
      'Indústria e Manufatura': 'Sua indústria',
      'Saúde': 'Sua clínica',
      'Serviços e Consultoria': 'Sua agência'
    };
    
    const empresaTipo = segTexts[segmento] || 'Sua empresa';
    
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
      { max: 100, label: 'Alta Performance', color: '#10b981' }
    ];
    
    const scoreCat = scoreLabels.find(s => score <= s.max);
    const circleOffset = 251 - (251 * (score / 100));

    const recupAuto = (maxLoss * 0.6 / 1000).toFixed(1);
    const recupInteg = (maxLoss * 0.35 / 1000).toFixed(1);

    // Preparar payload para API
    const payload = {
      nome: textData.nome,
      empresa: textData.empresa,
      whatsapp: textData.whatsapp.replace(/\D/g, ''),
      segmento: segmento,
      horas_perdidas: this.questions[1].options[answers.horas_perdidas].title,
      dor_principal: dorPrincipal,
      faturamento: this.questions[3].options[answers.faturamento].title,
      maturidade: this.questions[4].options[answers.maturidade].title,
      score: score,
      custo_mensal: lostValueStr,
      location: this.location,
      completed_at: new Date().toISOString()
    };

    // Salvar lead imediatamente (fire and forget)
    this.api.saveLead(payload).then(result => {
      if (!result.success) {
        console.warn('Lead salvo localmente para retry posterior');
      }
    });

    body.innerHTML = `
      <div class="reveal visible" style="animation: fadeIn 0.5s ease-out;">
        <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--color-slate-900); margin-bottom: 8px; line-height: 1.3;">
          ${nome}, encontramos o problema.
        </h2>
        <p style="color: var(--color-slate-500; font-size: 15px; margin-bottom: 32px;">
          Processamos os dados da <strong>${empresa}</strong> contra o benchmark do seu setor.
        </p>
        
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 32px; padding: 24px; background: var(--color-slate-50); border: 1px solid var(--color-slate-200); border-radius: 16px;">
          <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0;">
            <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-slate-200)" stroke-width="8"></circle>
              <circle id="score-circle" cx="50" cy="50" r="40" fill="none" stroke="var(--color-electric-500)" stroke-width="8" stroke-linecap="round" 
                style="stroke-dasharray: 251; stroke-dashoffset: 251; transition: stroke-dashoffset 1.5s ease-out 0.5s;"></circle>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--color-slate-900);">${score}</span>
              <span style="font-size: 10px; color: var(--color-slate-400); font-weight: 700;">/100</span>
            </div>
          </div>
          <div style="flex: 1;">
            <span style="font-size: 13px; color: var(--color-slate-500); display: block; margin-bottom: 4px;">Maturidade Operacional</span>
            <span style="font-family: var(--font-display); font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: ${scoreCat.color};">
              ${scoreCat.label}
            </span>
          </div>
        </div>

        <div style="background: var(--color-slate-50); border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden; border: 1px solid var(--color-slate-200); border-left: 4px solid #ef4444;">
          <span style="display: inline-block; color: #ef4444; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">
            Custo Invisível Estimado
          </span>
          <div style="font-family: var(--font-display); font-size: 36px; font-weight: 800; color: var(--color-slate-900); line-height: 1; margin: 8px 0 12px; letter-spacing: -0.02em;">
            ${lostValueStr} <span style="font-size: 16px; color: var(--color-slate-500); font-weight: 500;">/mês</span>
          </div>
          <p style="font-size: 14px; color: var(--color-slate-600); line-height: 1.6; margin: 0;">
            Equivale a <strong>${workersEquiv} funcionários</strong> trabalhando o mês inteiro apenas para cobrir ineficiências.
          </p>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid var(--color-emerald-500);">
          <div style="color: #064e3b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
            Oportunidade Identificada
          </div>
          <div style="font-family: var(--font-display); font-size: 28px; font-weight: 800; color: #065f46; letter-spacing: -0.02em;">
            R$ ${(maxLoss / 1000).toFixed(0)}k <span style="font-size: 16px; font-weight: 600;">/mês recuperáveis</span>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--color-slate-900); margin-bottom: 20px;">
            Plano de Ação Sugerido:
          </h3>
          
          ${[
            { label: '1. Automação de Tarefas', value: `R$ ${recupAuto}k`, width: '85%', color: 'var(--color-electric-500)' },
            { label: '2. Integração de Sistemas', value: `R$ ${recupInteg}k`, width: '65%', color: 'var(--color-electric-400)' },
            { label: '3. Dashboards de Controle', value: 'Alto Valor', width: '40%', color: 'var(--color-slate-400)' }
          ].map((item, i) => `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                <span style="color: var(--color-slate-700); font-weight: 600;">${item.label}</span>
                <span style="color: var(--color-emerald-600); font-weight: 700;">${item.value}</span>
              </div>
              <div style="height: 6px; background: var(--color-slate-200); border-radius: 4px; overflow: hidden;">
                <div class="progress-bar-anim" data-width="${item.width}" style="height: 100%; background: ${item.color}; width: 0%; transition: width 1s ease-out ${1 + (i * 0.3)}s;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #d97706; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 32px;">
          <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
          Restam apenas 4 agendas para novos clientes esta semana.
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="btn btn-secondary js-wpp-direct" style="width: 100%; border-color: var(--color-emerald-500); color: var(--color-emerald-600);">
            <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
            Agendar minha conversa de 20 min gratuita
          </button>
          <button class="btn btn-primary js-wpp" style="width: 100%; justify-content: center; padding: 18px; font-size: 16px;">
            Quero meu plano estrutural para a ${empresa}
            <i data-lucide="arrow-right" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
      </div>
    `;
    
    this.ui.refreshIcons();

    // Trigger animations
    setTimeout(() => {
      document.getElementById('score-circle').style.strokeDashoffset = circleOffset;
      document.querySelectorAll('.progress-bar-anim').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
    }, 100);

    // Bind CTA buttons
    const message = CONFIG.WHATSAPP.MESSAGE_TEMPLATE
      .replace('{score}', score)
      .replace('{empresa}', empresa);

    const openWhatsApp = () => {
      window.open(`https://wa.me/${CONFIG.WHATSAPP.NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    };

    document.querySelector('.js-wpp')?.addEventListener('click', openWhatsApp);
    document.querySelector('.js-wpp-direct')?.addEventListener('click', openWhatsApp);
  }

  nextStep() {
    const next = this.state.data.currentStep + 1;
    this.state.setStep(next);
    this.renderStep();
  }

  prevStep() {
    const prev = this.state.data.currentStep - 1;
    if (prev >= 0) {
      this.state.setStep(prev);
      this.renderStep();
    }
  }
}

// ==== DADOS DO QUIZ ====
const QUESTIONS = [
  {
    id: 'segmento',
    label: 'PASSO 1 DE 5',
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
    id: 'horas_perdidas',
    label: 'PASSO 2 DE 5',
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
    id: 'dor',
    label: 'PASSO 3 DE 5',
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
    id: 'faturamento',
    label: 'PASSO 4 DE 5',
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
    id: 'maturidade',
    label: 'PASSO 5 DE 5',
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
    id: 'contato',
    label: '',
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

const ECHOS = {
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

// ==== INICIALIZAÇÃO ====
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar módulos
  const state = new QuizState();
  const api = new APIService();
  const ui = new UIManager(state, api);
  const quiz = new QuizManager(state, api, ui);
  
  // Expor para debug (remover em produção)
  if (process.env.NODE_ENV === 'development') {
    window.BGTECH = { state, api, ui, quiz };
  }
});
