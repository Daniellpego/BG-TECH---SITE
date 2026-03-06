// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Overview View
// ═══════════════════════════════════════════════

import { fmtR, filterData, safe, pct } from '../utils.js';
import * as State from '../state.js';

export function renderOverview() {
    const { m, y } = State.getFilters();
    const isConf = x => x?.status === 'Confirmado';

    const eM = filterData(State.getEntradas(), m, y).filter(isConf);
    const fM = filterData(State.getFixos(), m, y).filter(isConf);
    const vM = filterData(State.getVariaveis(), m, y).filter(isConf);

    const sumMRR = safe(eM.filter(x => x.recorrencia === 'mensal').reduce((a, b) => a + Number(b.valor), 0));
    const sumEntradas = safe(eM.reduce((a, b) => a + Number(b.valor), 0));
    const sumFixos = safe(fM.reduce((a, b) => a + Number(b.valor), 0));
    const sumVariaveis = safe(vM.reduce((a, b) => a + Number(b.valor), 0));
    const totalGastos = sumFixos + sumVariaveis;

    const margemLiq = sumEntradas > 0 ? (sumEntradas - totalGastos - (sumEntradas * State.getState().aliquota_imposto)) / sumEntradas : 0;
    const burnRate = totalGastos;
    const runway = burnRate > 0 ? State.getState().caixa / burnRate : (State.getState().caixa > 0 ? 99 : 0);

    document.getElementById('v-caixa-ov').textContent = fmtR(State.getState().caixa);
    document.getElementById('v-mrr-ov').textContent = fmtR(sumMRR);
    document.getElementById('v-receita-ov').textContent = fmtR(sumEntradas);
    document.getElementById('v-fixed-ov').textContent = fmtR(sumFixos);
    document.getElementById('v-margin-ov').textContent = (margemLiq * 100).toFixed(1) + '%';
    document.getElementById('v-burn-ov').textContent = fmtR(burnRate);
    document.getElementById('v-runway-ov').textContent = runway >= 99 ? '99+ meses' : runway.toFixed(1) + ' meses';
}
