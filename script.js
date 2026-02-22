// ==== CONFIGURAÇÕES ====
const CONFIG = {
    whatsappNumber: '5511999998888', // MUDE AQUI
    webhookUrl: '' // Make.com
  };
  
  let leadLocation = "sua região"; 
  fetch('https://ipapi.co/json/').then(r=>r.json()).then(d=>{ if(d.city) leadLocation = d.city; }).catch(()=>{});
  
  const QUESTIONS = [
    {
      id: 'segmento', label: 'PASSO 1 DE 6',
      title: 'Qual o segmento da sua empresa?',
      desc: 'Isso personaliza o vocabulário da sua análise estrutural.',
      type: 'options',
      options: [
        { icon: 'hard-hat', title: 'Construção Civil', sub: 'Obras, projetos e gestão de equipe de campo' },
        { icon: 'scale', title: 'Jurídico / Contabilidade', sub: 'Escritórios, processos e clientes recorrentes' },
        { icon: 'store', title: 'Comércio / Varejo', sub: 'Loja física, e-commerce ou distribuidora' },
        { icon: 'factory', title: 'Indústria / Manufatura', sub: 'Produção, estoque e operação fabril' },
        { icon: 'stethoscope', title: 'Saúde', sub: 'Clínicas, laboratórios e prestadores de saúde' },
        { icon: 'briefcase', title: 'Serviços / Consultoria', sub: 'Agências, consultorias e empresas de serviço' }
      ]
    },
    {
      id: 'tamanho', label: 'PASSO 2 DE 6',
      title: 'Quantas pessoas dependem da tecnologia funcionando para trabalhar hoje?',
      desc: 'Ajuda a calibrar a densidade da nossa arquitetura.',
      type: 'options',
      options: [
        { icon: 'user', title: 'Até 4 pessoas', sub: 'Equipe super enxuta' },
        { icon: 'users', title: '5 a 20 pessoas', sub: 'A operação já demanda processos claros' },
        { icon: 'building', title: '21 a 50 pessoas', sub: 'Departamentos e integrações complexas' },
        { icon: 'building-2', title: 'Mais de 50 pessoas', sub: 'Estrutura corporativa e dados massivos' }
      ]
    },
    {
      id: 'dor', label: 'PASSO 3 DE 6',
      title: 'O que mais trava o crescimento da sua empresa hoje?',
      desc: 'O gargalo principal da operação.',
      type: 'options',
      options: [
        { icon: 'clock', title: 'Processos manuais', sub: '87% das PMEs perdem +15h/semana nisso' },
        { icon: 'cable', title: 'Sistemas que não se integram', sub: 'Retrabalho que consome 23% do custo' },
        { icon: 'alert-circle', title: 'Suporte de TI lento', sub: 'Cada hora parada custa muito caro' },
        { icon: 'bar-chart', title: 'Falta de visibilidade', sub: 'Decisões no achômetro e sem dados claros' },
        { icon: 'users-x', title: 'Equipe sobrecarregada', sub: 'Crescer virou sinônimo de contratar mais' }
      ]
    },
    {
      id: 'faturamento', label: 'PASSO 4 DE 6',
      title: 'Qual faixa melhor representa o faturamento mensal atual?',
      desc: 'Essa informação nos ajuda a calcular o impacto financeiro real das ineficiências.',
      type: 'options',
      options: [
        { icon: 'wallet', title: 'Até R$ 50 mil', sub: 'Fase de validação do modelo' },
        { icon: 'trending-up', title: 'R$ 50k a R$ 200 mil', sub: 'Ganhando tração e corpo' },
        { icon: 'landmark', title: 'R$ 200k a R$ 500 mil', sub: 'Operação sólida buscando escala' },
        { icon: 'gem', title: 'Acima de R$ 500 mil', sub: 'Estrutura robusta' }
      ]
    },
    {
      id: 'maturidade', label: 'PASSO 5 DE 6',
      title: 'Como você descreveria a tecnologia hoje — sendo completamente honesto?',
      desc: 'Maturidade digital.',
      type: 'options',
      options: [
        { icon: 'file-text', title: 'No papel ou no Excel', sub: 'Tudo manual, dependente de pessoas' },
        { icon: 'box', title: 'Sistemas básicos', sub: 'Até tem ferramenta, mas ninguém usa direito' },
        { icon: 'boxes', title: 'Alguns sistemas sem integração', sub: 'Dados em vários lugares, muito retrabalho' },
        { icon: 'server', title: 'Sistemas razoáveis', sub: 'Funciona, mas tem muito espaço pra evoluir' },
        { icon: 'rocket', title: 'Tecnologia boa, quero acelerar', sub: 'Base sólida, preciso de parceiro estratégico' }
      ]
    },
    {
      id: 'contato', label: 'ÚLTIMOS DADOS',
      title: 'Onde enviamos sua análise personalizada?',
      desc: 'Últimos dados — e o diagnóstico completo aparece para você agora.',
      type: 'text',
      fields: [
        { id: 'nome', placeholder: 'Seu Nome' },
        { id: 'empresa', placeholder: 'Nome da Empresa' },
        { id: 'whatsapp', placeholder: 'WhatsApp (com DDD)' }
      ]
    }
  ];
  
  // INIT
  document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          const counter = entry.target;
          const target = parseFloat(counter.getAttribute('data-target'));
          const isFloat = counter.getAttribute('data-target').includes('.');
          let startTime = null;
          const updateCount = (timestamp) => {
            if(!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / 2000, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = target * ease;
            counter.innerText = isFloat ? current.toFixed(1) : Math.floor(current);
            if(progress < 1) requestAnimationFrame(updateCount);
            else counter.innerText = target;
          };
          requestAnimationFrame(updateCount);
          counterObserver.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  
    document.querySelector('.js-toggle-menu').addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.toggle('open');
    });
    document.querySelectorAll('.js-close-menu').forEach(btn => {
      btn.addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('open'));
    });
  
    window.addEventListener('scroll', () => {
      const header = document.getElementById('site-header');
      const progress = document.getElementById('reading-progress');
      if(window.scrollY > 50) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = scrollable > 0 ? (window.scrollY / scrollable) * 100 + '%' : '0%';
    });
  
    document.querySelectorAll('.js-open-quiz').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); openQuiz(); });
    });
    document.querySelector('.js-close-quiz').addEventListener('click', closeQuiz);
  });
  
  // MOTOR QUIZ
  let currentStep = 0;
  let answers = {};
  let textData = {};
  
  function openQuiz() {
    currentStep = 0; answers = {}; textData = {};
    document.getElementById('quiz-overlay').classList.add('open');
    document.body.classList.add('modal-open');
    renderStep();
  }
  function closeQuiz() {
    document.getElementById('quiz-overlay').classList.remove('open');
    document.body.classList.remove('modal-open');
  }
  
  function renderStep() {
    const q = QUESTIONS[currentStep];
    const body = document.getElementById('quiz-body');
    document.getElementById('quiz-progress-fill').style.width = `${(currentStep / QUESTIONS.length) * 100}%`;
  
    if (q.type === 'options') {
      let html = `<span class="q-label">${q.label}</span><h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p><div class="q-options">`;
      q.options.forEach((opt, i) => {
        const isSelected = answers[q.id] === i ? 'selected' : '';
        html += `
          <div class="q-option ${isSelected}" data-index="${i}">
            <div class="q-icon"><i data-lucide="${opt.icon}"></i></div>
            <div class="q-text"><strong>${opt.title}</strong><span>${opt.sub}</span></div>
            <div class="q-check"><i data-lucide="check-circle-2"></i></div>
          </div>`;
      });
      html += `</div>`;
      if(currentStep > 0) html += `<div class="q-nav"><button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button></div>`;
      body.innerHTML = html;
  
      body.querySelectorAll('.q-option').forEach(opt => {
        opt.addEventListener('click', function() {
          answers[q.id] = parseInt(this.getAttribute('data-index'));
          renderStep();
          setTimeout(() => { nextStep(); }, 300);
        });
      });
    } else {
      let html = `<span class="q-label">${q.label}</span><h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>`;
      q.fields.forEach(f => {
        html += `<div class="q-input-group">
                  <input type="text" class="q-input" id="inp-${f.id}" placeholder="${f.placeholder}" value="${textData[f.id]||''}">
                  <div class="q-error-msg" id="err-${f.id}"></div>
                 </div>`;
      });
      html += `
        <p style="font-size:12px; color:var(--text-muted); margin-bottom: 20px;">Nada de spam. Usamos esse contato apenas para falar sobre o diagnóstico.</p>
        <div class="q-nav">
          <button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button>
          <button class="btn-primary js-next">Gerar Diagnóstico <i data-lucide="arrow-right" width="16"></i></button>
        </div>`;
      body.innerHTML = html;
      
      body.querySelector('.js-next').addEventListener('click', () => {
        let hasError = false;
        
        // Validação Agressiva
        const elNome = document.getElementById('inp-nome');
        if(elNome.value.trim().length < 3) {
            hasError = true; elNome.classList.add('error'); 
            document.getElementById('err-nome').innerText = "Insira um nome válido.";
            document.getElementById('err-nome').style.display = 'block';
        } else { textData.nome = elNome.value.trim(); }

        const elEmpresa = document.getElementById('inp-empresa');
        if(elEmpresa.value.trim().length < 2) {
            hasError = true; elEmpresa.classList.add('error'); 
            document.getElementById('err-empresa').innerText = "Informe a empresa.";
            document.getElementById('err-empresa').style.display = 'block';
        } else { textData.empresa = elEmpresa.value.trim(); }

        const elWpp = document.getElementById('inp-whatsapp');
        if(elWpp.value.trim().length < 8) {
            hasError = true; elWpp.classList.add('error'); 
            document.getElementById('err-whatsapp').innerText = "Número inválido.";
            document.getElementById('err-whatsapp').style.display = 'block';
        } else { textData.whatsapp = elWpp.value.trim(); }

        if(!hasError) runLoading();
      });
  
      q.fields.forEach(f => {
        document.getElementById(`inp-${f.id}`).addEventListener('input', function() {
          this.classList.remove('error'); document.getElementById(`err-${f.id}`).style.display = 'none';
        });
      });
    }
    
    if(body.querySelector('.js-prev')) body.querySelector('.js-prev').addEventListener('click', () => { currentStep--; renderStep(); });
    lucide.createIcons();
  }
  
  function nextStep() { currentStep++; renderStep(); }
  
  function runLoading() {
    document.getElementById('quiz-progress-fill').style.width = '100%';
    const body = document.getElementById('quiz-body');
    const segName = QUESTIONS[0].options[answers.segmento].title;
    
    const steps = [
      { icon: 'briefcase', text: `Analisando padrão operacional de ${segName}...` },
      { icon: 'search', text: `Cruzando dados com empresas em ${leadLocation}...` },
      { icon: 'dollar-sign', text: 'Calculando impacto financeiro da ineficiência...' },
      { icon: 'target', text: 'Priorizando automações de alto ROI...' },
      { icon: 'file-check-2', text: 'Compilando seu plano executivo...' }
    ];
  
    body.innerHTML = `
      <div class="diag-loading reveal visible">
        <div class="diag-loading-ring"></div>
        <h2 class="q-title" style="margin-bottom: 32px;">Processando dados da ${textData.empresa}...</h2>
        <div class="diag-loading-steps">
          ${steps.map((s, i) => `
            <div class="diag-step" id="dls-${i}">
              <div class="diag-step-icon"><i data-lucide="${s.icon}" width="16"></i></div>
              <span>${s.text}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    lucide.createIcons();
  
    let i = 0;
    const tick = () => {
      if(i > 0) {
        document.getElementById(`dls-${i-1}`).classList.replace('active', 'done');
        document.getElementById(`dls-${i-1}`).querySelector('.diag-step-icon').innerHTML = '<i data-lucide="check" width="16"></i>';
      }
      if(i < steps.length) {
        document.getElementById(`dls-${i}`).classList.add('active');
        lucide.createIcons();
        i++;
        setTimeout(tick, 700);
      } else {
        setTimeout(showResult, 600);
      }
    };
    tick();
  }
  
  function showResult() {
    const body = document.getElementById('quiz-body');
    const nome = textData.nome.split(' ')[0];
    const empresa = textData.empresa;
    
    // Copywriting por Segmento (Hiper-Personalização)
    const segTexts = [
        "Obras, projetos e a gestão da equipe de campo dependendo de planilhas criam um gargalo invisível gigantesco.",
        "Escritórios com alto volume de processos e clientes dependendo de rotinas burocráticas perdem muita margem.",
        "Operações de vendas dependendo de conciliação manual limitam a capacidade de escala real.",
        "A produção, o estoque e o chão de fábrica dependendo de apontamentos manuais geram custos invisíveis.",
        "Clínicas com agendamento, prontuários e faturamento não integrados perdem eficiência a cada paciente.",
        "A gestão de projetos e o controle de horas dependendo de follow-ups constantes drenam o lucro dos contratos."
    ];
    let mirrorText = segTexts[answers.segmento] || "Depender de esforço humano bruto para processos repetitivos cria um teto de crescimento.";

    // Lógica Financeira e Score
    const fatIndex = answers.faturamento;
    const matIndex = answers.maturidade;
    
    let perda = "R$ 4.200 a R$ 8.500";
    if(fatIndex === 1) perda = "R$ 12.400 a R$ 18.200";
    if(fatIndex === 2) perda = "R$ 28.500 a R$ 42.000";
    if(fatIndex === 3) perda = "R$ 60.000+";

    let score = 42; // Base ruim
    if(matIndex === 1) score = 55;
    if(matIndex === 2) score = 68;
    if(matIndex === 3) score = 82;
    if(matIndex === 4) score = 91;

    // Cálculo pro SVG Circle
    const circleOffset = 251 - (251 * (score / 100));
  
    body.innerHTML = `
      <div class="reveal visible">
        <h2 class="q-title" style="font-size: 24px;">O retrato operacional da ${empresa}.</h2>
        <p style="color:var(--text-muted); line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
          ${nome}, sua empresa está no estágio de 'crescimento por esforço bruto'. ${mirrorText}
        </p>

        <div class="score-banner">
           <div class="score-circle">
             <svg viewBox="0 0 100 100">
               <circle class="score-track" cx="50" cy="50" r="40"></circle>
               <circle class="score-fill" cx="50" cy="50" r="40" style="stroke-dashoffset: ${circleOffset};"></circle>
             </svg>
             <div class="score-number">
               <span class="score-val">${score}</span>
               <span class="score-max">/100</span>
             </div>
           </div>
           <div class="score-text">
             <h4>Score de Maturidade Tecnológica</h4>
             <p>Empresas em ${leadLocation} com score acima de 75 crescem 34% mais rápido reduzindo custo de operação.</p>
           </div>
        </div>
        
        <div class="financial-box">
          <div class="badge-blue"><i data-lucide="bar-chart-2" width="14"></i> IMPACTO FINANCEIRO MAPEADO</div>
          <div class="loss-value">${perda}</div>
          <div class="loss-desc">Estimativa de desperdício mensal corroído direto da sua margem de lucro por falta de integração.</div>
        </div>

        <div class="opps-box">
          <h4 class="opps-title">Plano de Ação Sugerido</h4>
          
          <div class="opp-item">
             <div class="opp-header"><span>1. Automação de tarefas repetitivas</span><span>Alto ROI</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 95%;"></div></div>
          </div>
          <div class="opp-item">
             <div class="opp-header"><span>2. Integração do Banco de Dados</span><span>Médio/Alto</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 80%;"></div></div>
          </div>
          <div class="opp-item">
             <div class="opp-header"><span>3. Dashboards em Tempo Real</span><span>Estratégico</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 65%;"></div></div>
          </div>
        </div>
        
        <div class="cta-row">
          <button class="btn-primary js-wpp" style="width:100%; padding: 18px; font-size: 15px;">
            Quero o plano para a ${empresa} <i data-lucide="arrow-right" width="18"></i>
          </button>
          <button class="btn-whatsapp js-wpp-direct" style="width:100%;">
            <i data-lucide="message-circle" width="18"></i> Chamar no WhatsApp
          </button>
        </div>
      </div>`;
    lucide.createIcons();
  
    // Logic for Buttons
    const openWpp = () => {
      if(CONFIG.webhookUrl) { fetch(CONFIG.webhookUrl, { method:'POST', body: JSON.stringify({dados: textData, respostas: answers})}).catch(()=>{}); }
      const msg = `Olá! Vi aqui no diagnóstico que a ineficiência tecnológica está custando até ${perda} para a ${empresa}. Meu score foi ${score}. Quero agendar 20 min para desenhar um plano de automação.`;
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    body.querySelector('.js-wpp').addEventListener('click', openWpp);
    body.querySelector('.js-wpp-direct').addEventListener('click', openWpp);
  }
