# Deploy Notes — v2.0.1-sync

**Data:** 2026-03-04  
**Branch:** main  
**Deploy:** Push → GitHub → Vercel auto-deploy  
**Severidade:** P0 (hotfix)

---

## O que mudou

### Bug corrigido
> "As abas de CRUD (Custos Fixos / Projeções etc.) mostram dados inseridos,
> mas ao voltar para 'Painel Geral' os KPIs ficam zerados."

### Causa raiz (3 problemas)
1. **Race condition `pushSync()` ↔ `fetchSync()`** — `pushSync()` não bloqueava o intervalo de 20s do `fetchSync()`, que sobrescrevia o state local com dados do servidor antes do push completar.
2. **fYear hardcoded** — O filtro de ano era fixo no HTML (`<option value="2026" selected>`). Se o sistema não estivesse em 2026, items novos não passavam pelo filtro.
3. **Duplicação na edição** — Ao editar um item, `arr` era capturado antes do `filter()` que removia o item antigo, causando duplicatas (versão antiga + nova coexistiam).

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `painel-cfo/index.html` | 6 patches JS: init year sync, _normDate, save() edit fix, pushSync guard, re-render pós-push, _safe() NaN guard |
| `vercel.json` | Versão do header atualizada |
| `api/painel.js` | Sem mudança (já estava correto da v2.0.0-secure) |

### Arquivos novos
| Arquivo | Descrição |
|---------|-----------|
| `painel-cfo/tests/e2e/08-dashboard-sync.spec.js` | 6 testes E2E para o bugfix (T1-T6) |
| `painel-cfo/audit/BUGFIX-painel-geral.md` | Relatório completo do bug P0 |
| `painel-cfo/audit/DEPLOY-NOTES.md` | Este arquivo |

---

## Testes executados antes do deploy

| Suite | Resultado |
|-------|-----------|
| Smoke test (API read/write/validation) | ✅ 5/5 |
| E2E 08-dashboard-sync (Chromium) | ✅ 6/6 |

---

## Como validar em produção (3 passos)

### Passo 1 — API funcional
```
Abrir no navegador: https://<dominio>/api/painel
Esperado: JSON com fixos, unicos, entradas, caixa_disponivel, updated_at
Status: 200
```

### Passo 2 — KPIs refletem dados após CRUD
```
1. Login (daniel / admin2024)
2. Ir para aba "Custos Fixos"
3. Clicar "+ Novo" → preencher nome, valor R$ 100, status "Confirmado" → Salvar
4. Voltar para "Painel Geral"
5. Verificar que "Custos Fixos" e "Burn Rate" aumentaram ~R$ 100
```

### Passo 3 — Reload e cross-browser
```
1. Dar F5 (reload completo)
2. Fazer login novamente
3. Verificar que os KPIs mostram os mesmos valores de antes do reload
4. Repetir em Chrome e no celular (se possível)
```

---

## Rollback
Se necessário, reverter para o commit anterior:
```bash
git revert HEAD
git push
```
Vercel fará redeploy automático com a versão anterior.
