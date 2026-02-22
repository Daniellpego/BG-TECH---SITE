// ==== CONFIGURAÇÕES ====
const CONFIG = {
    whatsappNumber: '5511999998888', // MUDE PARA O SEU NUMERO
    webhookUrl: '' // Webhook do Make
  };
  
  let leadLocation = "sua região"; 
  fetch('https://ipapi.co/json/').then(r=>r.json()).then(d=>{ if(d.city) leadLocation = d.city; }).catch(()=>{});
  
  // A MATRIZ DE VENDAS
  const QUESTIONS = [
    {
      id: 'segmento', label: 'PASSO 1 DE 5',
      title: 'Qual o segmento da sua empresa?',
      desc: 'Isso personaliza o vocabulário da sua análise.',
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
      desc: 'Seja honesto, some mentalmente as horas de retrabalho e planilhas antes de responder.',
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
      title: 'O que mais trava o crescimento da sua empresa hoje?',
      desc: 'Escolha a opção que mais machuca a operação.',
      type: 'options',
      options: [
        { icon: 'clock', title: 'Processos manuais', sub: 'Sua equipe é boa. Só que 30% do dia dela vai pro lixo.' },
        { icon: 'cable', title: 'Sistemas que não se integram', sub: 'Você paga por ferramentas que não se falam.' },
        { icon: 'alert-circle', title: 'Suporte de TI lento', sub: 'Cada hora parada custa dinheiro. Você sabe disso.' },
        { icon: 'bar-chart', title: 'Falta de visibilidade', sub: 'Você decide com base no feeling e não em dados.' },
        { icon: 'users-x', title: 'Equipe sobrecarregada', sub: 'Crescer virou sinônimo de contratar mais. Não devia ser assim.' }
      ]
    },
    {
      id: 'faturamento', label: 'PASSO 4 DE 5',
      title: 'Qual faixa melhor representa o faturamento mensal atual?',
      desc: 'Essa informação determina o impacto financeiro real que vai aparecer no seu diagnóstico.',
      type: 'options',
      options: [
        { icon: 'wallet', title: 'Até R$ 50 mil', sub: 'Fase de validação do modelo' },
        { icon: 'trending-up', title: 'R$ 50k a R$ 200 mil', sub: 'Ganhando tração e corpo' },
        { icon: 'landmark', title: 'R$ 200k a R$ 500 mil', sub: 'Operação sólida buscando escala' },
        { icon: 'gem', title: 'Acima de R$ 500 mil', sub: 'Estrutura robusta' }
      ]
    },
    {
      id: 'maturidade', label: 'PASSO 5 DE 5',
      title: 'Sendo completamente honesto, como você descreveria a tecnologia hoje?',
      desc: 'A maturidade digital atual da sua empresa.',
      type: 'options',
      options: [
        { icon: 'file-text', iconColor: 'icon-red', title: 'No papel ou Excel', sub: 'Tudo manual, dependente de pessoas' },
        { icon: 'box', iconColor: 'icon-orange', title: 'Sistemas básicos', sub: 'Até tem ferramenta, mas ninguém usa direito' },
        { icon: 'boxes', iconColor: 'icon-yellow', title: 'Sistemas sem integração', sub: 'Dados espalhados, muito retrabalho' },
        { icon: 'server', iconColor: 'icon-green', title: 'Sistemas razoáveis', sub: 'Funciona, mas tem muito espaço pra evoluir' },
        { icon: 'rocket', iconColor: 'icon-blue', title: 'Tecnologia boa', sub: 'Base sólida, preciso de parceiro estratégico' }
      ]
    },
    {
      id: 'contato', label: 'DIAGNÓSTICO PRONTO',
      title: 'Para liberar o resultado completo, confirme seus dados:',
      desc: 'Seu diagnóstico está sendo compilado.',
      type: 'text',
      fields: [
        { id: 'nome', placeholder: 'Como você prefere ser chamado?' },
        { id: 'empresa', placeholder: 'Nome da empresa' },
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
          const duration = 2000;
          
          const updateCount = (timestamp) => {
            if(!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
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
  let currentStep = -1;
  let answers = {};
  let textData = {};
  
  function openQuiz() {
    currentStep = -1; answers = {}; textData = {};
    document.getElementById('quiz-overlay').classList.add('open');
    document.body.classList.add('modal-open');
    renderIntro();
  }
  function closeQuiz() {
    document.getElementById('quiz-overlay').classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  function renderIntro() {
    const body = document.getElementById('quiz-body');
    document.getElementById('quiz-progress-fill').style.width = '0%';
    
    body.innerHTML = `
      <div class="quiz-intro reveal visible">
        <h2>O Diagnóstico BG Tech</h2>
        <p>Nos próximos 3 minutos, você vai descobrir exatamente quanto dinheiro sua empresa está perdendo por mês e o motivo claro por trás disso.</p>
        <p>Não é uma estimativa genérica. É um cálculo baseado no perfil real da sua operação.</p>
        <div class="quiz-intro-hint">
          Seja completamente honesto. Quanto mais preciso você for nas respostas, mais preciso será o resultado que vamos entregar.
        </div>
        <button class="btn-primary btn-large js-start-quiz" style="width: 100%;">Estou pronto <i data-lucide="arrow-right"></i></button>
      </div>
    `;
    lucide.createIcons();
    body.querySelector('.js-start-quiz').addEventListener('click', () => { currentStep = 0; renderStep(); });
  }
  
  function renderStep() {
    const q = QUESTIONS[currentStep];
    const body = document.getElementById('quiz-body');
    const bar = document.getElementById('quiz-progress-fill');
    
    if(q.id === 'contato') {
        bar.style.width = '80%';
        bar.classList.add('pulse-progress');
    } else {
        bar.style.width = `${(currentStep / QUESTIONS.length) * 100}%`;
        bar.classList.remove('pulse-progress');
    }
  
    if (q.type === 'options') {
      let html = `<div class="reveal visible"><span class="q-label">${q.label}</span><h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>`;
      
      html += `<div class="q-options">`;
      q.options.forEach((opt, i) => {
        const iconClass = opt.iconColor ? opt.iconColor : '';
        html += `
          <div class="q-option" data-index="${i}">
            <div class="q-icon"><i data-lucide="${opt.icon}" class="${iconClass}"></i></div>
            <div class="q-text"><strong>${opt.title}</strong><span>${opt.sub}</span></div>
          </div>`;
      });
      html += `</div>`;
      if(currentStep > 0) html += `<div class="q-nav"><button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button></div>`;
      html += `</div>`;
      body.innerHTML = html;
  
      body.querySelectorAll('.q-option').forEach(opt => {
        opt.addEventListener('click', function() {
          const idx = parseInt(this.getAttribute('data-index'));
          answers[q.id] = idx;
          
          if(q.id === 'segmento') {
             const segName = q.options[idx].title;
             body.innerHTML = `<div class="micro-validation"><i data-lucide="check-circle-2" style="margin-bottom:12px;width:32px;height:32px;"></i><br>Calibrando diagnóstico para ${segName}...</div>`;
             lucide.createIcons();
             setTimeout(() => { nextStep(); }, 1200);
          } else {
             nextStep();
          }
        });
      });
    } else {
      let html = `<div class="reveal visible"><span class="q-label">${q.label}</span><h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>`;
      q.fields.forEach(f => {
        html += `<div class="q-input-group">
                  <input type="text" class="q-input" id="inp-${f.id}" placeholder="${f.placeholder}" value="${textData[f.id]||''}">
                  <div class="q-error-msg" id="err-${f.id}"></div>
                 </div>`;
      });
      html += `
        <p style="font-size:12px; color:var(--text-muted); margin-bottom: 20px;">Usamos esse contato apenas para falar sobre este diagnóstico e nada mais.</p>
        <div class="q-nav">
          <button class="btn-ghost js-prev"><i data-lucide="arrow-left" width="16"></i> Voltar</button>
          <button class="btn-primary js-next">Liberar meu diagnóstico <i data-lucide="unlock" width="16"></i></button>
        </div></div>`;
      body.innerHTML = html;
      
      body.querySelector('.js-next').addEventListener('click', () => {
        let hasError = false;
        
        const elNome = document.getElementById('inp-nome');
        const nomeVal = elNome.value.trim();
        if(nomeVal.length < 3 || nomeVal.split(' ').length < 2) {
            hasError = true; elNome.classList.add('error'); 
            document.getElementById('err-nome').innerText = "Insira seu nome e sobrenome.";
            document.getElementById('err-nome').style.display = 'block';
        } else { textData.nome = nomeVal; }

        const elEmpresa = document.getElementById('inp-empresa');
        if(elEmpresa.value.trim().length < 2) {
            hasError = true; elEmpresa.classList.add('error'); 
            document.getElementById('err-empresa').innerText = "Informe a empresa.";
            document.getElementById('err-empresa').style.display = 'block';
        } else { textData.empresa = elEmpresa.value.trim(); }

        const elWpp = document.getElementById('inp-whatsapp');
        if(elWpp.value.trim().length < 9) {
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
    const bar = document.getElementById('quiz-progress-fill');
    bar.classList.remove('pulse-progress');
    bar.style.width = '100%';
    
    const body = document.getElementById('quiz-body');
    const segName = QUESTIONS[0].options[answers.segmento].title;
    
    const fatIndex = answers.faturamento;
    let basePerda = 6500;
    if(fatIndex === 1) basePerda = 14000;
    if(fatIndex === 2) basePerda = 32000;
    if(fatIndex === 3) basePerda = 65000;
    
    const steps = [
      { icon: 'briefcase', text: `Mapeando gargalos típicos no setor de ${segName}...` },
      { icon: 'search', text: `Cruzando dados com empresas de perfil similar em ${leadLocation}...` },
      { icon: 'dollar-sign', text: `Calculando horas perdidas por semana...`, special: true },
      { icon: 'target', text: 'Priorizando automações com maior retorno para sua margem...' },
      { icon: 'file-check-2', text: 'Montando seu plano executivo...' }
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
                <span>${s.text}</span>
                ${s.special ? `<div class="partial-number" id="flash-num" style="display:none;">Estimativa parcial: R$ ${(basePerda * 0.8).toLocaleString('pt-BR')} perdidos...</div>` : ''}
              </div>
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
        if(steps[i-1].special) document.getElementById('flash-num').style.display = 'none';
      }
      if(i < steps.length) {
        document.getElementById(`dls-${i}`).classList.add('active');
        if(steps[i].special) document.getElementById('flash-num').style.display = 'block';
        lucide.createIcons();
        i++;
        setTimeout(tick, i === 3 ? 1500 : 1000); 
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
    
    // Copy Humana
    const segTexts = [
        "Sua construtora chegou num ponto crítico. A operação cresceu, mas os processos não. Cada obra nova exige mais planilhas, mais reuniões e horas de gestão manual.",
        "Seu escritório chegou num ponto crítico. O volume de processos cresceu, mas o trabalho continua manual. Cada novo cliente exige horas de burocracia.",
        "Sua operação chegou num ponto crítico. As vendas cresceram, mas a gestão não acompanhou. O giro de pedidos exige um esforço braçal que destrói a eficiência.",
        "Sua indústria chegou num ponto crítico. A produção roda, mas a gestão do chão de fábrica para o escritório é manual. Cada erro custa matéria-prima e tempo.",
        "Sua clínica chegou num ponto crítico. O fluxo de pacientes aumentou, mas o agendamento e o faturamento não conversam. O atendimento fica engessado.",
        "Sua agência chegou num ponto crítico. Os contratos cresceram, mas a gestão de horas e entregas virou um caos de planilhas. A margem do projeto some rapidamente."
    ];
    let mirrorText = segTexts[answers.segmento] || "Sua empresa chegou num ponto crítico. A operação cresceu, mas os processos não acompanharam.";

    const fatIndex = answers.faturamento;
    const matIndex = answers.maturidade;
    
    let minLoss = 4200, maxLoss = 8500;
    if(fatIndex === 1) { minLoss = 14500; maxLoss = 22000; }
    if(fatIndex === 2) { minLoss = 28500; maxLoss = 42000; }
    if(fatIndex === 3) { minLoss = 65000; maxLoss = 98000; }
    
    const lostValueStr = `R$ ${minLoss.toLocaleString('pt-BR')} a R$ ${maxLoss.toLocaleString('pt-BR')} por mês`;
    const workersEquiv = (maxLoss / 3500).toFixed(1);

    let score = 38; 
    if(matIndex === 1) score = 52;
    if(matIndex === 2) score = 61;
    if(matIndex === 3) score = 78;
    if(matIndex === 4) score = 92;

    const circleOffset = 251 - (251 * (score / 100));
    
    const recupAuto = (maxLoss * 0.6).toLocaleString('pt-BR');
    const recupInteg = (maxLoss * 0.35).toLocaleString('pt-BR');
    const totalRecup = (maxLoss * 0.95).toLocaleString('pt-BR');
  
    body.innerHTML = `
      <div class="reveal visible">
        <h2 class="q-title" style="font-size: 24px;">${nome}, encontramos o problema.</h2>
        <div class="mirror-text">
          ${mirrorText} Você sente que a equipe trabalha mais, porém a empresa não cresce de forma proporcional. Isso tem causa e tem solução.
        </div>

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
             <h4>Você está entre os 34% que já identificaram a dor, mas ainda não resolveram.</h4>
             <p>As empresas que resolveram têm score médio de 78+. A grande diferença é ter um parceiro de tecnologia focado em agir rápido.</p>
           </div>
        </div>
        
        <div class="result-box">
          <div class="alert-tag">CUSTO MENSAL DAS INEFICIÊNCIAS</div>
          <div class="loss-value">${lostValueStr}</div>
          <div class="loss-desc">Baseado no faturamento e padrão operacional da sua região. Esse valor sai direto da sua margem de lucro.</div>
          <div class="equivalence">Equivale a ${workersEquiv} funcionários trabalhando o mês inteiro só para cobrir retrabalho.</div>
        </div>

        <div class="opps-box">
          <div class="opp-item">
             <div class="opp-header"><span>1. Automação de tarefas repetitivas</span><span>Alto ROI</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 85%;"></div></div>
             <div class="opp-sub">Potencial de recuperação estimado: R$ ${recupAuto} por mês</div>
          </div>
          <div class="opp-item">
             <div class="opp-header"><span>2. Integração dos sistemas atuais</span><span>Médio/Alto</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 65%;"></div></div>
             <div class="opp-sub">Potencial de recuperação estimado: R$ ${recupInteg} por mês</div>
          </div>
          <div class="opp-item">
             <div class="opp-header"><span>3. Dashboard de gestão em tempo real</span><span>Estratégico</span></div>
             <div class="opp-bar-wrap"><div class="opp-bar" style="width: 45%;"></div></div>
             <div class="opp-sub">Impacto drástico em tomada de decisão e escala</div>
          </div>
          <div style="margin-top: 24px; font-weight: 800; font-size: 16px; color: var(--text-1);">
             Oportunidade total mapeada: R$ ${totalRecup} recuperáveis todos os meses.
          </div>
        </div>
        
        <div style="border-top: 1px solid var(--border-light); padding-top: 32px;">
          <p style="font-size: 16px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.6;">
            ${nome}, o plano de ação está pronto. O próximo passo lógico é uma conversa de 20 minutos com nosso time. Sem apresentação de vendas e sem propostas agressivas. <strong>Nosso time de consultores já viu este diagnóstico antes de falar com você.</strong>
          </p>
          <button class="btn-primary js-wpp" style="width:100%; padding: 20px; font-size: 16px; margin-bottom: 12px;">
            Quero meu plano para a ${empresa} <i data-lucide="arrow-right" width="18"></i>
          </button>
          <button class="btn-whatsapp js-wpp-direct" style="width:100%;">
            <i data-lucide="message-circle" width="18"></i> Falar agora com nosso time
          </button>
          <p style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 12px;">Resposta em até 2 horas úteis. Sem compromisso.</p>
        </div>
      </div>`;
    lucide.createIcons();
  
    const openWpp = () => {
      if(CONFIG.webhookUrl) { 
          fetch(CONFIG.webhookUrl, { 
              method:'POST', 
              body: JSON.stringify({
                  dados: textData, 
                  respostas: answers, 
                  visualizou_resultado: true,
                  timestamp: new Date().toISOString()
              })
          }).catch(()=>{}); 
      }
      const msg = `Olá! Fiz o diagnóstico da BG Tech agora. Meu score foi ${score}/100 e o custo estimado foi de até R$ ${(maxLoss/1000).toFixed(0)}k mensais em ineficiências. Quero conversar sobre os próximos passos para a ${empresa}.`;
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    body.querySelector('.js-wpp').addEventListener('click', openWpp);
    body.querySelector('.js-wpp-direct').addEventListener('click', openWpp);
  }
