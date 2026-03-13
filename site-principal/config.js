// ══════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL DO SITE BG TECH
// Altere os valores abaixo UMA VEZ e todos os links se atualizam.
// ══════════════════════════════════════════════════════════

const SITE_CONFIG = {
  // WhatsApp — trocar pelo número real da empresa
  whatsapp: '5543999751504',
  whatsappMensagem: 'Olá! Vi o site da BG Tech e quero saber mais sobre automação para minha empresa.',

  // Números exibidos no site (manter consistentes)
  empresasAtendidas: '47+',
  diagnosticosRealizados: '47+',

  // Supabase (anon key pública — segura para client-side)
  supabaseUrl: 'https://urpuiznydrlwmaqhdids.supabase.co',
  supabaseAnonKey: '', // ← COLAR A ANON KEY AQUI (painel Supabase > Settings > API > anon public)
};

// Atualiza automaticamente todos os links com classe js-wpp-link
document.addEventListener('DOMContentLoaded', function () {
  var links = document.querySelectorAll('.js-wpp-link');
  for (var i = 0; i < links.length; i++) {
    links[i].href = 'https://wa.me/' + SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent(SITE_CONFIG.whatsappMensagem);
  }
});
