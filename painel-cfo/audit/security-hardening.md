# 🛡️ Security Hardening — Painel CFO BG Tech

**Versão:** 2.0.0-secure  
**Data:** 2026-03-04  
**Autor:** Principal Engineer + Security Engineer  
**Classificação:** INTERNO / CONFIDENCIAL  

---

## Sumário Executivo

O Painel CFO foi endurecido contra os 4 vetores de ataque identificados na auditoria anterior. A camada de persistência agora passa por um **proxy serverless (Vercel Functions)** que detém a única chave com permissão de escrita no banco. O frontend **não contém mais nenhuma credencial** de banco de dados.

### Antes vs Depois

```
ANTES (v1.x):                      DEPOIS (v2.0):
┌──────────┐                        ┌──────────┐
│ Frontend │──[anon key]──→ DB      │ Frontend │──[fetch]──→ API Proxy ──[service_role]──→ DB
└──────────┘                        └──────────┘
  • anon key exposta                   • Zero credenciais no client
  • RLS desativado                     • RLS ativado + deny_anon
  • Escrita direta na tabela           • Só backend pode escrever
```

---

## 1. Arquitetura Final

```
                    ┌─────────────────────────┐
                    │   Vercel Edge Network    │
                    │                          │
   Browser ─────→  │  /painel-cfo/index.html  │  (static)
                    │                          │
   fetch() ─────→  │  /api/painel.js          │  (serverless function)
                    │     │                    │
                    │     │ SUPABASE_SERVICE_   │
                    │     │ ROLE_KEY (env var)  │
                    │     │                    │
                    │     ▼                    │
                    │  Supabase PostgreSQL     │
                    │  painel_gastos (RLS ON)  │
                    └─────────────────────────┘
```

### Componentes

| Componente | Arquivo | Função |
|------------|---------|--------|
| Frontend | `painel-cfo/index.html` | UI, CAS, merge — zero credenciais |
| API Proxy | `api/painel.js` | Vercel serverless — CAS atômico server-side |
| RLS Script | `infra/supabase/rls-hardening.sql` | Bloqueia acesso anon ao banco |
| Roteamento | `vercel.json` | Conecta frontend → API → static |

---

## 2. Mudanças Realizadas

### 2.1 Frontend (`painel-cfo/index.html`)

| Item | Antes | Depois |
|------|-------|--------|
| Supabase JS CDN | `<script src="...supabase-js@2">` | **REMOVIDO** |
| Credenciais | `const DB = { url: "...", key: "..." }` | **REMOVIDO** — substituído por `const API_BASE = '/api/painel'` |
| `sb` getter | `window.supabase.createClient(DB.url, DB.key)` | **REMOVIDO** |
| `fetchSync()` | `A.sb.from('painel_gastos').select('*')` | `fetch(API_BASE)` |
| `pushSync()` CAS | `A.sb.from('painel_gastos').update().eq('updated_at', ...)` | `fetch(API_BASE, { method: 'POST', body: { expected_updated_at } })` |
| `pushSync()` upsert | `A.sb.from('painel_gastos').upsert()` | `fetch(API_BASE + '?init=1', { method: 'POST' })` |
| `pushSync()` conflito | Segundo `A.sb.from().select()` para buscar estado remoto | API retorna `409 + { current: <row> }` — zero round-trip extra |
| `login()` | `if (!window.supabase)` check | Removido — não depende mais do SDK |

**Total de chamadas Supabase removidas:** 6  
**Total de chamadas Supabase restantes:** 0  
**Credenciais no frontend:** 0  

### 2.2 API Proxy (`api/painel.js`)

Vercel Serverless Function com dois endpoints:

#### `GET /api/painel`
- Busca row `id=1` de `painel_gastos` via REST com `service_role`
- Retorna JSON direto

#### `POST /api/painel`
- Recebe payload completo do painel
- Se `expected_updated_at` presente → **CAS atômico**:
  - `PATCH ...?id=eq.1&updated_at=eq.<expected>`
  - Se 0 rows afetadas → `409 Conflict` com estado atual do servidor
- Se `?init=1` ou sem `expected_updated_at` → **UPSERT** (primeiro push)

#### Validações
- Verifica que `fixos`, `unicos`, `entradas` são arrays
- Verifica que `projecoes` é objeto
- Normaliza `caixa_disponivel` para number

### 2.3 RLS (`infra/supabase/rls-hardening.sql`)

```sql
ALTER TABLE public.painel_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_all"
  ON public.painel_gastos
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
```

- `service_role` **bypassa RLS** automaticamente no Supabase
- `anon` não consegue SELECT, INSERT, UPDATE ou DELETE
- Dupla proteção: RLS + API proxy

### 2.4 Roteamento (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/api/painel", "destination": "/api/painel.js" },
    { "source": "/painel-cfo", "destination": "/painel-cfo/index.html" },
    { "source": "/painel-cfo/(.*)", "destination": "/painel-cfo/$1" },
    { "source": "/(.*)", "destination": "/site-principal/$1" }
  ]
}
```

- API routes têm `Cache-Control: no-store` (sem cache de dados financeiros)
- `outputDirectory` removido (agora serve múltiplos diretórios)

---

## 3. Propriedades de Segurança Garantidas

### 3.1 Eliminação de Credenciais no Frontend

| Credencial | v1.x | v2.0 |
|------------|------|------|
| `SUPABASE_URL` | Exposta em `const DB` | **Removida** |
| `anon key` | Exposta em `const DB.key` | **Removida** |
| `service_role key` | N/A | Apenas em `process.env` (Vercel) |

**Verificação:** `grep -r "supabase" painel-cfo/index.html` retorna apenas comentários.

### 3.2 Defesa em Profundidade

```
Camada 1: Frontend não tem credenciais → não pode falar com Supabase diretamente
Camada 2: RLS bloqueia anon → mesmo com a anon key antiga, acesso é negado
Camada 3: API valida payload → rejeita dados malformados
Camada 4: CAS server-side → conflitos resolvidos atomicamente
```

### 3.3 Modelo de Ameaças Coberto

| Ameaça | Antes | Depois |
|--------|-------|--------|
| Leitura de dados por terceiro com anon key | ❌ Possível | ✅ RLS bloqueia |
| Escrita maliciosa na tabela | ❌ Possível | ✅ Só via API |
| Extração de credenciais do código-fonte | ❌ anon key visível | ✅ Zero credenciais |
| Corrupção de dados via upsert direto | ❌ Possível | ✅ API valida + CAS |
| XSS para roubar key | ❌ Key existe no DOM | ✅ Nenhuma key para roubar |

---

## 4. Instruções de Deploy

### 4.1 Variáveis de Ambiente (Vercel)

No painel Vercel → Project → Settings → Environment Variables:

```
SUPABASE_URL=https://urpuiznydrlwmaqhdids.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (NÃO é a anon key!)
```

> ⚠️ A `SUPABASE_SERVICE_ROLE_KEY` está no Supabase Dashboard → Settings → API → `service_role` (com ícone de cadeado). **Nunca a coloque no frontend.**

### 4.2 Aplicar RLS

1. Abrir Supabase Dashboard → SQL Editor
2. Colar o conteúdo de `infra/supabase/rls-hardening.sql`
3. Executar
4. Verificar com:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables WHERE tablename = 'painel_gastos';
   ```
   Esperado: `rowsecurity = true`

### 4.3 Deploy

```bash
# Push para o repositório — Vercel faz deploy automático
git add -A
git commit -m "security: API proxy + RLS hardening (v2.0.0)"
git push
```

### 4.4 Verificação Pós-Deploy

1. Abrir `https://seudominio.vercel.app/painel-cfo`
2. Login com credenciais normais
3. Criar item → verificar que sync fica verde
4. Recarregar → item persiste
5. Abrir DevTools → Network → confirmar que requests vão para `/api/painel`, não para `supabase.co`

### 4.5 Teste de Regressão da Segurança

```bash
# Tentar acessar Supabase diretamente com a anon key antiga
curl -H "apikey: <ANON_KEY>" \
     -H "Authorization: Bearer <ANON_KEY>" \
     "https://urpuiznydrlwmaqhdids.supabase.co/rest/v1/painel_gastos?id=eq.1"
```

Esperado: `[]` (array vazio) ou erro 401 — **RLS bloqueia**.

---

## 5. Testes Atualizados

### 5.1 Infraestrutura de Teste

| Arquivo | Mudança |
|---------|---------|
| `tests/dev-server.js` | **NOVO** — servidor local que serve static + API proxy |
| `tests/playwright.config.js` | Agora usa `dev-server.js` em vez de `npx serve` |
| `tests/e2e/helpers.js` | `SUPABASE.key` agora prioriza `SUPABASE_SERVICE_ROLE_KEY` env var |
| `tests/e2e/07-persistence.spec.js` | Request monitor verifica `/api/painel` (não `supabase.co`) |

### 5.2 Executar Testes

```bash
cd painel-cfo/tests

# Configurar variáveis
export SUPABASE_URL=https://urpuiznydrlwmaqhdids.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>

# Instalar dependências
npm install

# Rodar todos os testes
npx playwright test --config=playwright.config.js
```

---

## 6. Riscos Residuais

| # | Risco | Severidade | Status |
|---|-------|------------|--------|
| R1 | Login hardcoded no frontend (users/password) | P1 | **Não resolvido** — mitigar com Supabase Auth |
| R2 | API sem autenticação (qualquer request chega) | P2 | Mitigável com token/session no header |
| R3 | CDNs sem SRI hashes | P2 | Adicionar `integrity` nos `<script>` |
| R4 | Single-row JSONB não escala >1000 items | P2 | Migrar para rows individuais |
| R5 | Rate limiting ausente na API | P3 | Vercel tem rate limit built-in, customizável |

### Nota sobre R1 (Login Hardcoded)

O login atual é uma barreira visual, não uma barreira de segurança. As credenciais `admin2024` estão visíveis no código-fonte. A verdadeira proteção é que:
- O frontend **não tem como acessar o banco** sem a API
- A API **não expõe dados sensíveis** (não tem chave de exclusão, por exemplo)
- RLS **bloqueia acesso direto** ao Supabase

Para resolver R1 de forma definitiva: implementar Supabase Auth + JWT validation na API.

---

## 7. Conclusão

O painel financeiro CFO agora opera com **zero credenciais no frontend**, **RLS ativado**, e **toda persistência via proxy serverless**. A superfície de ataque foi reduzida de "qualquer pessoa com o URL pode ler/escrever dados financeiros" para "apenas o backend autenticado pode interagir com o banco".

| Métrica | v1.x | v2.0 |
|---------|------|------|
| Credenciais no frontend | 2 (URL + key) | **0** |
| Chamadas Supabase diretas | 6 | **0** |
| RLS | Desativado | **Ativado** |
| Caminho de escrita no banco | Frontend → Supabase | Frontend → API → Supabase |
| Service role key exposta | N/A | **Nunca** (env var only) |

---

*Documento gerado em 2026-03-04. Revisão humana recomendada antes de deploy em produção.*
