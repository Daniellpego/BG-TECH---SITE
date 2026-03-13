// ══════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL DO SITE BG TECH
// Altere os valores abaixo UMA VEZ e todos os links se atualizam.
// ══════════════════════════════════════════════════════════

const SITE_CONFIG = {
  whatsapp: '5543997800051',
  whatsappLink: 'https://wa.me/5543997800051',
  whatsappMensagem: 'Olá! Vi o site da BG Tech e quero saber mais sobre automação para minha empresa.',
  email: 'contato@bgtechsolucoes.com.br',
  cnpj: '65.663.208/0001-36',
  razaoSocial: 'BG Tech Soluções em Tecnologia LTDA',
  endereco: 'R. Joaquim Antônio dos Santos, 148 - Jardim Tarumã, Londrina/PR - CEP 86.038-610',
  cidade: 'Londrina',
  estado: 'PR',
  telefone: '(43) 99780-0051',
  site: 'https://www.bgtechsolucoes.com.br',
  empresasAtendidas: '47+',
  tagline: 'Engenharia Digital para Empresas Inteligentes',

  // Supabase (anon key pública — segura para client-side)
  supabaseUrl: 'https://urpuiznydrlwmaqhdids.supabase.co',
  supabaseAnonKey: '', // ← COLAR A ANON KEY AQUI (painel Supabase > Settings > API > anon public)
};

// Atualiza automaticamente todos os links com classe js-wpp-link
document.addEventListener('DOMContentLoaded', function () {
  var links = document.querySelectorAll('.js-wpp-link');
  for (var i = 0; i < links.length; i++) {
    links[i].href = SITE_CONFIG.whatsappLink + '?text=' + encodeURIComponent(SITE_CONFIG.whatsappMensagem);
  }
});
