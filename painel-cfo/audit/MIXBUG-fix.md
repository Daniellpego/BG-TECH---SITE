# MIXBUG Fix Report (v2.0.2-mixbug)

## Escopo aplicado
- Correção de sincronização para impedir overwrite do estado local durante mutações/push concorrente.
- Polling inteligente com short-circuit por `updated_at`.
- IDs determinísticos para recorrência, imposto automático e projeções automáticas.
- Logs estruturados em `?debug=1` para mutação/sync/render com métrica `uiCount`.
- Nova suíte E2E: `tests/e2e/09-mixbug.spec.js`.

## Mudanças técnicas

### 1) State machine mínima
Adicionados no estado:
- `_dirty`
- `_pendingPush`
- `_syncInFlight`
- `_mutationSeq`
- `_lastServerUpdatedAt`
- `_uiCountFloor`

Fluxo:
- `beginMutation(kind)` em `save`, `del`, `saveProj`, `delProj`, `editCaixa`.
- `endMutation(kind, ok)` ao final de cada mutação.
- Durante `_dirty || _pendingPush>0`, `fetchSync()` não aplica snapshot remoto.

### 2) fetchSync anti-overwrite + polling inteligente
`fetchSync(silent)` agora:
- registra `requestSeq`.
- compara `remote updated_at` com `_lastUpdatedAt` quando `silent=true`.
- se não mudou, faz `skip` sem `render`.
- se `_dirty/_pendingPush`, faz `skip` sem aplicar arrays.
- se `requestSeq` ficou stale, faz `skip`.

### 3) Merge em conflito 409 sem render intermediário remoto
Mantido padrão:
- POST CAS -> 409
- usa `conflict.current` (server)
- `mergeArrays(localSnap, remoteData)`
- retry POST
- sem render de base remota intermediária

### 4) IDs determinísticos
Adicionados helpers:
- `deterministicId`, `deterministicRecurringId`, `deterministicTaxId`, `deterministicAutoProjectionId`, `itemFingerprint`.

Aplicação:
- recorrência mensal/próximo em `save()` usa ID determinístico por `(tipo, cliente, categoria, yyyy-mm, descricao)`.
- imposto automático DRE recebe `id` determinístico por mês (`tax:YYYY-MM`).
- linha automática de imposto em projeções recebe `data-auto-id` determinístico por `(mês atual, tipo)`.
- `ensureIds()` agora usa fingerprint determinístico para backfill, não randômico.

### 5) Logs estruturados
Eventos adicionados:
- `mutation:start|end`
- `sync:fetch:start|skip|apply|end`
- `sync:push:start|409|merge|success|fail|end`
- `render:start|end`

Todos com contexto de `seq`, `dirty`, `pendingPush`, `updatedAt` e `uiCount`.

## Resultado esperado
- Não sobrescrever UI com snapshot remoto durante mutação/push.
- Redução de flicker/sumir-voltar no polling.
- Menor chance de duplicação/perda por IDs instáveis em recorrência/auto-itens.
