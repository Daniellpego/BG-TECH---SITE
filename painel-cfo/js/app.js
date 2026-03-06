// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Main Application Entry
// ═══════════════════════════════════════════════

import * as Auth from './auth.js';
import * as State from './state.js';
import * as DB from './db.js';
import { toast, maskMoney } from './utils.js';
import { renderOverview } from './views/overview.js';
import { renderDRE } from './views/dre.js';
import { renderLancamentosTable, openDrawer, addTag, removeTag } from './views/lancamentos.js';
import { renderAnual } from './views/annual.js';
import { renderProjecoes } from './views/projecoes.js';

const loginScreen = document.getElementById('login-screen');
const appEl = document.getElementById('app');

async function initApp() {
    await State.loadAll();
    navigate('overview');

    DB.subscribeRealtime(
        (p) => { State.handleRealtimeEvent('cfo_lancamentos', p); renderActiveView(); },
        (p) => { State.handleRealtimeEvent('cfo_projecoes', p); renderActiveView(); },
        (p) => { State.handleRealtimeEvent('cfo_config_v2', p); renderActiveView(); }
    );
}

function navigate(tab) {
    State.setTab(tab);
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `view-${tab}`);
    });

    if (tab === 'academia') refreshTaxDisplay();
    renderActiveView();
}

function renderActiveView() {
    const tab = State.getTab();
    if (tab === 'overview') renderOverview();
    else if (tab === 'dre') renderDRE();
    else if (tab === 'anual') renderAnual();
    else if (tab === 'projecoes') renderProjecoes();
    else if (['entradas', 'fixos', 'unicos'].includes(tab)) renderLancamentosTable();

    if (window.lucide) lucide.createIcons();
}

function refreshTaxDisplay() {
    const s = State.getState();
    const el = document.getElementById('academia-tax-info');
    if (el) el.textContent = `${s.regime_tributario} - Alíquota: ${(s.aliquota_imposto * 100).toFixed(1)}%`;
}

window.CFO = {
    ...window.CFO,
    navigate,
    openDrawer,
    addTag,
    removeTag,
    signOut: () => Auth.signOut(),
    openTaxModal: () => {
        const s = State.getState();
        document.getElementById('tax-regime').value = s.regime_tributario;
        document.getElementById('tax-rate').value = (s.aliquota_imposto * 100).toFixed(1);
        document.getElementById('tax-modal').classList.add('open');
        document.getElementById('tax-overlay').classList.add('open');
    },
    saveTaxConfig: async () => {
        const rate = parseFloat(document.getElementById('tax-rate').value) / 100;
        const regime = document.getElementById('tax-regime').value;
        if (await State.updateTaxConfig(rate, regime)) {
            document.getElementById('tax-modal').classList.remove('open');
            document.getElementById('tax-overlay').classList.remove('open');
            toast('Configuração fiscal atualizada!');
        }
    }
};

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    try {
        await Auth.signIn(email, pass);
        const overlay = document.getElementById('welcome-overlay');
        overlay.classList.remove('hidden');

        setTimeout(() => {
            loginScreen.style.display = 'none';
            appEl.classList.add('visible');
            setTimeout(() => {
                overlay.classList.add('hidden');
                initApp();
            }, 3000);
        }, 1500);
    } catch (err) {
        document.getElementById('login-error').textContent = err.message;
    }
});

Auth.onAuthChange(user => {
    if (user) {
        loginScreen.style.display = 'none';
        appEl.classList.add('visible');
        initApp();
    } else {
        loginScreen.style.display = 'flex';
        appEl.classList.remove('visible');
    }
});

document.querySelectorAll('.money-mask').forEach(i => i.addEventListener('input', maskMoney));
