// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Annual Balance View
// ═══════════════════════════════════════════════

import { fmtR, filterData, safe, MONTHS } from '../utils.js';
import * as State from '../state.js';

export function renderAnual() {
  const { y, client, project } = State.getFilters();
  const entradas = State.getEntradas();
  const variaveis = State.getVariaveis();
  const fixos = State.getFixos();
  const isConf = x => x?.status === 'Confirmado';

  const grid = document.getElementById('annual-grid');
  if (!grid) return;

  let html = '';
  for (let i = 0; i < 12; i++) {
    const eM = filterData(entradas, i, y, false, client, project).filter(isConf);
    const vM = filterData(variaveis, i, y, false, client, project).filter(isConf);
    const fM = filterData(fixos, i, y, false, client, project).filter(isConf);

    const income = safe(eM.reduce((a, b) => a + Number(b.valor), 0));
    const expense = safe(vM.reduce((a, b) => a + Number(b.valor), 0)) + safe(fM.reduce((a, b) => a + Number(b.valor), 0));
    const balance = income - expense;

    html += `
            <div class="card annual-card clickable" onclick="window.CFO.navigate('dre', { m: '${i}' })">
                <div class="annual-month">${MONTHS[i]}</div>
                <div class="annual-vals">
                    <div class="annual-val income">${fmtR(income)}</div>
                    <div class="annual-val expense">${fmtR(expense)}</div>
                </div>
                <div class="annual-balance ${balance >= 0 ? 'pos' : 'neg'}">${fmtR(balance)}</div>
            </div>
        `;
  }
  grid.innerHTML = html;
}
