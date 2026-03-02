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
          const ease
