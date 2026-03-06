// ═══════════════════════════════════════════════
// CFO Dashboard v2 — State Management
// ═══════════════════════════════════════════════

import * as DB from './db.js';
import * as Offline from './offline.js';
import { toast, setTaxRate } from './utils.js';

const state = {
    tab: 'overview',
    filters: {
        m: String(new Date().getMonth()),
        y: String(new Date().getFullYear()),
        client: '',
        project: ''
    },
    lancamentos: [],
    projecoes: [],
    caixa: 0,
    aliquota_imposto: 0.06,
    regime_tributario: 'Simples Nacional',
    user: null,
    online: navigator.onLine,
    syncing: false,
    listeners: [],
};

export const getState = () => state;
export const getFilters = () => state.filters;
export const getTab = () => state.tab;
export const setTab = (t) => { state.tab = t; notify(); };

export const getEntradas = () => state.lancamentos.filter(l => l.tipo === 'receita');
export const getFixos = () => state.lancamentos.filter(l => l.tipo === 'fixo');
export const getVariaveis = () => state.lancamentos.filter(l => l.tipo === 'variavel');

export async function loadAll() {
    state.syncing = true;
    notify();
    try {
        if (Offline.isOnline()) {
            const [lancamentos, projecoes, config] = await Promise.all([
                DB.fetchLancamentos(),
                DB.fetchProjecoes(),
                DB.fetchConfig()
            ]);
            state.lancamentos = lancamentos;
            state.projecoes = projecoes;
            state.caixa = config?.caixa_disponivel || 0;
            state.aliquota_imposto = config?.aliquota_imposto ?? 0.06;
            state.regime_tributario = config?.regime_tributario || 'Simples Nacional';

            setTaxRate(state.aliquota_imposto);

            // Sync to local
            await Offline.cacheLancamentos(lancamentos);
            await Offline.cacheProjecoes(projecoes);
            await Offline.cacheConfig({
                caixa_disponivel: state.caixa,
                aliquota_imposto: state.aliquota_imposto,
                regime_tributario: state.regime_tributario
            });
        } else {
            state.lancamentos = await Offline.getCachedLancamentos();
            state.projecoes = await Offline.getCachedProjecoes();
            const config = await Offline.getCachedConfig();
            if (config) {
                state.caixa = config.caixa_disponivel;
                state.aliquota_imposto = config.aliquota_imposto;
                state.regime_tributario = config.regime_tributario;
            }
        }
    } catch (err) {
        console.error('Load Error:', err);
        state.lancamentos = await Offline.getCachedLancamentos();
        state.projecoes = await Offline.getCachedProjecoes();
    } finally {
        state.syncing = false;
        notify();
    }
}

export async function saveLancamento(item) {
    try {
        if (Offline.isOnline()) {
            const saved = await DB.upsertLancamento(item);
            const idx = state.lancamentos.findIndex(l => l.id === saved.id);
            if (idx >= 0) state.lancamentos[idx] = saved;
            else state.lancamentos.push(saved);
        } else {
            await Offline.offlinePutLancamento(item);
            toast('Lançamento salvo offline', 'warn');
        }
        notify();
    } catch (err) {
        toast('Erro ao salvar lançamento', 'danger');
        throw err;
    }
}

export async function saveCaixa(valor) {
    try {
        if (Offline.isOnline()) {
            await DB.updateCaixa(valor);
        }
        state.caixa = valor;
        notify();
    } catch (err) {
        toast('Erro ao salvar caixa', 'danger');
    }
}

export async function updateTaxConfig(aliquota, regime) {
    try {
        if (Offline.isOnline()) {
            await DB.updateTaxConfig(aliquota, regime);
        }
        state.aliquota_imposto = aliquota;
        state.regime_tributario = regime;
        setTaxRate(aliquota);
        notify();
        return true;
    } catch (err) {
        toast('Erro ao salvar configuração fiscal', 'danger');
        return false;
    }
}

export function handleRealtimeEvent(table, payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (table === 'cfo_lancamentos') {
        if (eventType === 'DELETE') state.lancamentos = state.lancamentos.filter(l => l.id !== oldRec.id);
        else {
            const idx = state.lancamentos.findIndex(l => l.id === newRec.id);
            if (idx >= 0) state.lancamentos[idx] = newRec;
            else state.lancamentos.push(newRec);
        }
    } else if (table === 'cfo_config_v2' && eventType === 'UPDATE') {
        state.caixa = newRec.caixa_disponivel;
        state.aliquota_imposto = newRec.aliquota_imposto;
        state.regime_tributario = newRec.regime_tributario;
        setTaxRate(state.aliquota_imposto);
    }
    notify();
}

export function subscribe(cb) { state.listeners.push(cb); }
function notify() { state.listeners.forEach(cb => cb(state)); }

export function refreshFilterOptions() {
    // Logic to update client/project dropdowns based on all lancamentos
}
