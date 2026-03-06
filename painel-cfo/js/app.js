// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Robust Main Entry
// ═══════════════════════════════════════════════

import * as Auth from './auth.js';
import * as State from './state.js';
import * as DB from './db.js';
import { toast, maskMoney } from './utils.js';
import { renderOverview } from './views/overview.js';
import { renderDRE } from './views/dre.js';
import { renderLancamentosTable, openDrawer, addTag, removeTag } from './views/lancamentos.js';

const loginScreen = document.getElementById('login-screen');
const appEl = document.getElementById('app');
const welcomeOverlay = document.getElementById('welcome-overlay');

let isInitialized = false;

/**
 * BRAIN: Inicialização da Aplicação com Blindagem
 */
async function initApp() {
    if (isInitialized) return;
    isInitialized = true;

    console.log("🚀 [CFO] Iniciando carregamento de dados...");

    try {
        // Carrega tudo do Supabase/Local
        await State.loadAll();
        console.log("✅ [CFO] Estado carregado com sucesso.");

        // Navega para a visão inicial
        navigate('overview');

        // Subscrição em Tempo Real (Não bloqueante)
        DB.subscribeRealtime(
            (p) => { State.handleRealtimeEvent('cfo_lancamentos', p); renderActiveView(); },
            (p) => { State.handleRealtimeEvent('cfo_projecoes', p); renderActiveView(); },
            (p) => { State.handleRealtimeEvent('cfo_config_v2', p); renderActiveView(); }
        );

    } catch (error) {
        console.error("❌ [CFO Fatal] Erro na inicialização:", error);
        toast("Erro ao carregar dados. Verifique sua conexão.", "err");
        // Força a navegação para que a tela não fique branca em caso de erro parcial
        navigate('overview');
    }
}

/**
 * NAVEGAÇÃO ENTRE ABAS
 */
function navigate(tab) {
    try {
        console.log(`📍 [CFO] Navegando para: ${tab}`);
        State.setTab(tab);

        // Atualiza UI da Sidebar
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });

        // Mostra a View Correta
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${tab}`);
        });

        renderActiveView();
    } catch (err) {
        console.error(`❌ [CFO] Erro ao navegar para ${tab}:`, err);
    }
}

function renderActiveView() {
    const tab = State.getTab();
    try {
        if (tab === 'overview') renderOverview();
        else if (tab === 'dre') renderDRE();
        else if (['entradas', 'fixos', 'unicos'].includes(tab)) renderLancamentosTable();

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.warn(`⚠️ [CFO] Falha ao renderizar view ${tab}:`, err);
    }
}

/**
 * GERENCIAMENTO DE TRANSIÇÃO DE AUTH
 */
function handleAuthStatus(user) {
    console.log("🔐 [CFO] Status de Autenticação:", user ? "Logado" : "Deslogado");

    if (user) {
        // Exibe o overlay de boas-vindas
        if (welcomeOverlay) welcomeOverlay.classList.add('active');

        // Inicia o carregamento em background imediatamente
        initApp();

        // Transição visual suave
        setTimeout(() => {
            if (loginScreen) loginScreen.style.display = 'none';
            if (appEl) appEl.classList.add('visible');

            setTimeout(() => {
                if (welcomeOverlay) welcomeOverlay.classList.remove('active');
            }, 1800);
        }, 1000);

    } else {
        isInitialized = false;
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appEl) appEl.classList.remove('visible');
    }
}

// Inicialização Global
async function checkInitialAuth() {
    try {
        console.log("🔍 [CFO] Verificando sessão inicial...");
        const session = await Auth.getSession();
        handleAuthStatus(session?.user || null);
    } catch (err) {
        console.warn('⚠️ [CFO] Falha na checagem inicial:', err);
        handleAuthStatus(null);
    }
}

// Event Listeners de Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    try {
        btn.disabled = true;
        btn.innerHTML = 'Validando...';
        await Auth.signIn(email, pass);
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="log-in" width="20" height="20"></i> Entrar';
        if (window.lucide) lucide.createIcons();
        document.getElementById('login-error').textContent = err.message;
        console.error("❌ [CFO Login] Erro:", err.message);
    }
});

// API Global Exposta
window.CFO = {
    ...window.CFO,
    navigate,
    openDrawer,
    addTag,
    removeTag,
    signOut: async () => {
        await Auth.signOut();
        window.location.reload();
    }
};

Auth.onAuthChange(handleAuthStatus);
checkInitialAuth();

// Masks
document.querySelectorAll('.money-mask').forEach(i => i.addEventListener('input', maskMoney));
