// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Lançamentos Table View
// ═══════════════════════════════════════════════

import { fmtR, fmtD, maskMoney, cleanMoney, toast } from '../utils.js';
import * as State from '../state.js';

let currentTags = [];

export function renderLancamentosTable() {
    const tab = State.getTab();
    const { m, y } = State.getFilters();
    let data = [];

    if (tab === 'entradas') data = State.getEntradas();
    else if (tab === 'fixos') data = State.getFixos();
    else if (tab === 'unicos') data = State.getVariaveis();

    const filtered = data.filter(l => {
        const [ly, lm] = l.data.split('-');
        return ly === String(y) && (m === 'anual' || lm === String(parseInt(m) + 1).padStart(2, '0'));
    });

    const tbody = document.getElementById(`table-${tab}-body`);
    if (!tbody) return;

    tbody.innerHTML = filtered.map(l => `
        <tr>
            <td>${fmtD(l.data)}</td>
            <td>
                <div class="table-main-text">${l.nome}</div>
                <div class="table-sub-text">${l.categoria || 'Sem categoria'}</div>
                <div class="table-tags">
                   ${(l.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('')}
                </div>
            </td>
            <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td>
            <td style="text-align:right" class="font-title">${fmtR(l.valor)}</td>
            <td style="text-align:right">
                <button class="btn-icon" onclick="window.CFO.openDrawer('${l.id}')"><i data-lucide="edit-3"></i></button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

export function openDrawer(id = null) {
    const drawer = document.getElementById('drawer-lancamento');
    const form = document.getElementById('form-lancamento');
    form.reset();
    currentTags = [];

    if (id) {
        const item = State.getState().lancamentos.find(l => l.id === id);
        if (item) {
            document.getElementById('f-id').value = item.id;
            document.getElementById('f-nome').value = item.nome;
            document.getElementById('f-valor').value = item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            document.getElementById('f-data').value = item.data;
            document.getElementById('f-tipo').value = item.tipo;
            document.getElementById('f-cat').value = item.categoria;
            document.getElementById('f-status').value = item.status;
            document.getElementById('f-recor').value = item.recorrencia || 'unico';
            currentTags = [...(item.tags || [])];
        }
    }

    renderTagChips();
    drawer.classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
}

export function addTag(tag) {
    if (!tag || currentTags.includes(tag)) return;
    currentTags.push(tag);
    renderTagChips();
}

export function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTagChips();
}

function renderTagChips() {
    const container = document.getElementById('tags-chips-container');
    if (!container) return;
    container.innerHTML = currentTags.map(t => `
        <span class="tag-chip">
            ${t}
            <span class="tag-chip-remove" onclick="window.CFO.removeTag('${t}')">&times;</span>
        </span>
    `).join('');
}
