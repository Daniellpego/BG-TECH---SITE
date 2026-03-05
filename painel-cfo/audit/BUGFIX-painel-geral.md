# BUGFIX — Painel Geral KPIs Zerados (P0)

**Data:** 2026-03-05  
**Versão anterior:** v2.0.0-secure  
**Versão corrigida:** v2.0.1-sync  
**Arquivo:** `painel-cfo/index.html`  

---

## Problema Reportado

> "As abas de CRUD (Custos Fixos / Projeções etc.) mostram dados inseridos,
> mas ao voltar para 'Painel Geral' os KPIs ficam zerados."

---

## Diagnóstico — Hipóteses Avaliadas

| # | Hipótese | Resultado | Detalhes |
|---|----------|-----------|----------|
| H1 | render() usa snapshot stale | ✅ Confirmado (parcial) | pushSync não bloqueia fetchSync → estado sobrescrito |
| H2 | tab() não chama render() | ❌ Descartado | tab() sempre chama A.render() para abas não-projeções |
| H3 | Datas DD/MM/YYYY vs YYYY-MM-DD | ⚠️ Defensivo | Dados atuais usam YYYY-MM-DD, mas sem guarda para formatos legados |
| H4 | isConf() filtra tudo (status) | ❌ Descartado | Items novos default 'Confirmado'; normalizeLegacyStatus() corrige legados |
| H5 | getFilters() retorna ano errado | ✅ Confirmado | fYear hardcoded como 2026 no HTML; init() não sincroniza com system year |
| H6 | Race condition pushSync ↔ fetchSync | ✅ **ROOT CAUSE** | pushSync não seta _syncInFlight → fetchSync sobrescreve state local |

---

## Root Cause (Causa Raiz Principal)

### RC1 — Race Condition `pushSync()` ↔ `fetchSync()` (H6)

`pushSync()` NÃO setava `A.state._syncInFlight = true`, permitindo que o `fetchSync()` 
(que roda a cada 20 segundos via `setInterval`) executasse em paralelo.

**Sequência do bug:**
1. Usuário salva item → `save()` → `A.state.data.fixos.push(item)` → `render()` → `await pushSync()`
2. Enquanto `pushSync()` aguarda resposta do servidor...
3. `fetchSync(true)` dispara pelo intervalo de 20s
4. `fetchSync` carrega dados do servidor (ainda sem o novo item)
5. `fetchSync` sobrescreve `A.state.data = dados_antigos` → chama `render()`
6. KPIs calculados a partir dos dados antigos (sem o novo item) → **valores zerados**

### RC2 — Bug de Duplicação na Edição (save)

Ao editar um item, `arr` era capturado **antes** do `filter()` que remove o item antigo:

```javascript
// ANTES (bugado):
const arr = A.state.data[arrKey] || [];  // referência ao array ORIGINAL
['fixos', ...].forEach(k => { A.state.data[k] = ...filter... });  // cria NOVO array
arr.push(base);  // push no array ORIGINAL (ainda tem o item antigo!)
A.state.data[arrKey] = arr;  // sobrescreve com array que tem AMBAS as versões
```

Resultado: edições criavam duplicatas (versão antiga + nova coexistindo).

### RC3 — fYear Não Sincronizado (H5)

`init()` definia o mês do filtro via `new Date().getMonth()` mas NÃO sincronizava
o ano do filtro (`fYear`). O HTML hardcoded tinha `<option value="2026" selected>`.
Se o sistema estivesse em outro ano, novos itens (com data do sistema) não passariam
pelo filtro anual do overview.

---

## Correções Aplicadas (6 patches)

### Patch 1 — `init()`: Sincronização dinâmica de fYear
```
Gera opções de ano dinamicamente (ano atual ± 1) e seleciona o ano do sistema.
```

### Patch 2 — `filterData()`: Normalização de formato de data
```
Novo método _normDate() converte DD/MM/YYYY → YYYY-MM-DD antes de filtrar.
Guarda contra NaN em parseInt com check isNaN().
```

### Patch 3 — `save()`: Correção de duplicação em edição
```
Para edições, captura referência do array DEPOIS do filter, não antes.
Separa fluxo de edição vs novo item para clareza.
```

### Patch 4 — `pushSync()`: Guard _syncInFlight + re-render pós-sucesso
```
Seta _syncInFlight = true no início → bloqueia fetchSync concorrente.
Limpa no finally {} para garantir liberação em qualquer cenário.
Após push bem-sucedido, SEMPRE chama render() (não apenas em merge).
```

### Patch 5 — `render()`: Proteção NaN/Infinity nos KPIs
```
Novo helper _safe(v) = Number.isFinite(v) ? v : 0 aplicado em todas as
somas de KPI (sumE, sumF, sumU, sumMRR, prevSumMRR, prevSumE, prevSumBurn).
```

### Patch 6 — `filterData()`: Guard parts.length e isNaN
```
Verifica que split('-') retorna >= 2 partes.
Retorna false se parseInt resulta em NaN.
```

---

## Testes Criados

**Arquivo:** `tests/e2e/08-dashboard-sync.spec.js` — 6 testes

| Test | Nome | Hipótese | O que valida |
|------|------|----------|-------------|
| T1 | fYear defaults to system year | H5 | init() sincroniza fYear com getFullYear() |
| T2 | KPIs reflect after fixos → overview | H1/H2 | Navegação não zera KPIs |
| T3 | Add fixo → overview → KPIs include value | H1 | Item novo aparece nos KPIs em < 500ms |
| T4 | No NaN or Infinity | — | _safe() funciona em todos os KPIs |
| T5 | KPIs survive page reload | H6 | fetchSync restaura estado corretamente |
| T6 | Rapid tab switching stable | H6 | Race condition bloqueada pelo guard |

**Resultado:** ✅ 6/6 passed (Chromium)

---

## Critérios de Aceitação

| Critério | Status |
|----------|--------|
| KPIs refletem dados em < 500ms após troca de aba | ✅ Verificado (T2, T3) |
| Sem NaN / Infinity nos KPIs | ✅ Verificado (T4) |
| Sem erros no console | ✅ Verificado (T1) |
| Funciona após reload | ✅ Verificado (T5) |
| Smoke tests anteriores continuam passando | ✅ 5/5 passed |

---

## Regras Respeitadas

- ❌ NÃO redesenhou UI/CSS
- ❌ NÃO removeu filtros
- ✅ Apenas ajustes em lógica JS, fluxo de estado, parse de datas, e wiring de render/sync
