// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Projeções View
// ═══════════════════════════════════════════════

import { fmtR } from '../utils.js';
import * as State from '../state.js';

export function renderProjecoes() {
    const proj = State.getState().projecoes;
    const container = document.getElementById('projecoes-list');
    if (!container) return;

    const entradas = proj.filter(p => p.tipo === 'entrada');
    const saidas = proj.filter(p => p.tipo === 'saida');

    container.innerHTML = `
        <div class="proj-section">
            <h3 class="font-title">Entradas Previstas</h3>
            ${entradas.map(p => `
                <div class="proj-item">
                    <span>${p.nome}</span>
                    <span class="pos">${fmtR(p.valor)}</span>
                </div>
            `).join('')}
        </div>
        <div class="proj-section">
            <h3 class="font-title">Saídas Previstas</h3>
            ${saidas.map(p => `
                <div class="proj-item">
                    <span>${p.nome}</span>
                    <span class="neg">${fmtR(p.valor)}</span>
                </div>
            `).join('')}
        </div>
    `;
}
