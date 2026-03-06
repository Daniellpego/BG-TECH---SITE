// ═══════════════════════════════════════════════
// CFO Dashboard v2 — DRE Gerencial View
// ═══════════════════════════════════════════════

import { fmtR, filterData, calcTax, safe, pct, MONTHS } from '../utils.js';
import * as State from '../state.js';

export function renderDRE() {
    const { m, y, client, project } = State.getFilters();
    const isConf = x => x?.status === 'Confirmado';

    const eMC = filterData(State.getEntradas(), m, y, false, client, project).filter(isConf);
    const uMC = filterData(State.getVariaveis(), m, y, false, client, project).filter(isConf);
    const fMC = filterData(State.getFixos(), m, y, false, client, project).filter(isConf);

    const rbM = safe(eMC.reduce((a, b) => a + Number(b.valor), 0));
    const cvM = safe(uMC.reduce((a, b) => a + Number(b.valor), 0));
    const mbM = rbM - cvM;
    const cfM = safe(fMC.reduce((a, b) => a + Number(b.valor), 0));
    const roM = mbM - cfM;
    const impM = calcTax(rbM);
    const rlM = roM - impM;

    const eYTD = filterData(State.getEntradas(), m, y, true, client, project).filter(isConf);
    const rbYTD = safe(eYTD.reduce((a, b) => a + Number(b.valor), 0));
    const impYTD = calcTax(rbYTD);

    document.getElementById('dre-lbl-periodo').textContent = m === 'anual' ? `Ano ${y}` : `${MONTHS[parseInt(m)]}/ ${y}`;

    const html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th style="text-align:right">Mensal</th>
                    <th style="text-align:right">Acumulado</th>
                </tr>
            </thead>
            <tbody>
                <tr class="dre-row-main">
                    <td>Receita Bruta</td>
                    <td class="dre-val">${fmtR(rbM)}</td>
                    <td class="dre-val">${fmtR(rbYTD)}</td>
                </tr>
                <tr class="dre-row-sub">
                    <td>(-) Custos Variáveis</td>
                    <td class="dre-val-neg">${fmtR(cvM)}</td>
                    <td class="dre-val-neg">-</td>
                </tr>
                <tr class="dre-row-main highlight">
                    <td>Margem Bruta (L1)</td>
                    <td class="dre-val">${fmtR(mbM)} <span class="dre-pct">${pct(mbM, rbM)}</span></td>
                    <td class="dre-val">-</td>
                </tr>
                <tr class="dre-row-sub">
                    <td>(-) Custos Fixos</td>
                    <td class="dre-val-neg">${fmtR(cfM)}</td>
                    <td class="dre-val-neg">-</td>
                </tr>
                <tr class="dre-row-main highlight">
                    <td>Resultado Operacional (L2)</td>
                    <td class="dre-val">${fmtR(roM)}</td>
                    <td class="dre-val">-</td>
                </tr>
                <tr class="dre-row-sub">
                    <td>(-) Impostos (${(State.getState().aliquota_imposto * 100).toFixed(1)}%)</td>
                    <td class="dre-val-neg">${fmtR(impM)}</td>
                    <td class="dre-val-neg">${fmtR(impYTD)}</td>
                </tr>
                <tr class="dre-row-main final">
                    <td>Resultado Líquido (L3)</td>
                    <td class="dre-val ${rlM >= 0 ? 'pos' : 'neg'}">${fmtR(rlM)} <span class="dre-pct">${pct(rlM, rbM)}</span></td>
                    <td class="dre-val">-</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('dre-table-container').innerHTML = html;
}
