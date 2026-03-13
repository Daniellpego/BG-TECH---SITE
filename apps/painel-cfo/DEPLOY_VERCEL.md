# Deploy do Painel CFO na Vercel — Guia Completo

## Pre-requisitos

- Conta na Vercel (vercel.com)
- Repositorio no GitHub ja com push feito
- Projeto Supabase ja configurado (projeto: `urpuiznydrlwmaqhdids`)
- API Key do Groq (console.groq.com)

---

## Passo 1: Importar Projeto na Vercel

1. Acesse **vercel.com/new**
2. Clique em **"Import Git Repository"**
3. Selecione o repo: **Ecosistema-BG-Tech-2026**
4. Em **"Framework Preset"**: selecione **Next.js**
5. Em **"Root Directory"**: clique em **Edit** e coloque: `apps/painel-cfo`
6. Clique em **"Deploy"**

> Vai falhar na primeira vez — normal, faltam as variaveis de ambiente.

---

## Passo 2: Configurar Variaveis de Ambiente

Va em: **Project Settings > Environment Variables**

Adicione TODAS estas variaveis (marque **Production + Preview + Development**):

| Variavel | Onde pegar | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API > Project URL | `https://urpuiznydrlwmaqhdids.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API > anon public | `eyJhbGciOiJIUzI1NiIs...` |

### Importante sobre as variaveis

- **`NEXT_PUBLIC_`** = visivel no frontend (OK para Supabase URL e anon key)
- O `GROQ_API_KEY` ja esta configurado como **Supabase Secret** na Edge Function, nao precisa colocar na Vercel
- O `SUPABASE_SERVICE_ROLE_KEY` **NAO** deve ser adicionado na Vercel (so e necessario em operacoes admin diretas)

---

## Passo 3: Configurar Build

Em **Project Settings > General**:

- **Build Command**: `npm run build` (ou `next build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x`

---

## Passo 4: Re-deploy

Apos configurar as env vars:

1. Va em **Deployments**
2. Clique nos **3 pontinhos** do ultimo deploy
3. Clique em **"Redeploy"**
4. Aguarde o build completar (deve ser < 60 segundos)

---

## Passo 5: Verificar o Deploy

Apos o deploy completar com sucesso:

1. Acesse a URL fornecida pela Vercel (ex: `painel-cfo-xxx.vercel.app`)
2. Voce deve ser redirecionado para a pagina de **login**
3. Faca login com o email/senha cadastrado no Supabase Auth
4. Verifique se o **Dashboard** carrega corretamente com R$ 0,00 nos cards
5. Teste a navegacao entre as 8 abas

---

## Passo 6: Configurar Dominio Customizado (Opcional)

1. Va em **Project Settings > Domains**
2. Adicione seu dominio (ex: `cfo.bgtech.dev`)
3. Configure o DNS conforme instrucoes da Vercel:
   - Tipo: **CNAME**
   - Nome: `cfo` (ou o subdominio desejado)
   - Valor: `cname.vercel-dns.com`
4. Aguarde propagacao do DNS (ate 48h, geralmente < 1h)

---

## Troubleshooting

### Build falha com erro de TypeScript
- Verifique se o **Root Directory** esta correto: `apps/painel-cfo`
- Rode `npm run build` localmente para verificar erros

### Pagina branca apos deploy
- Verifique se as variaveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao configuradas
- Verifique o console do browser para erros

### Login nao funciona
- Confirme que a URL do site esta nas **Redirect URLs** do Supabase:
  - Va em Supabase > Authentication > URL Configuration
  - Adicione: `https://seu-dominio.vercel.app/**`

### Groq IA retorna erro
- O `GROQ_API_KEY` e um **Supabase Secret**, nao uma env var da Vercel
- Verifique no Supabase Dashboard > Edge Functions > Secrets
- Para verificar: `supabase secrets list --project-ref urpuiznydrlwmaqhdids`

### Dados nao aparecem
- As tabelas estao limpas (prontas para producao)
- O Gustavo deve cadastrar os dados reais via interface do painel
- Todos os cards mostrarao R$ 0,00 ate que dados sejam inseridos

---

## Arquitetura do Deploy

```
Vercel (Frontend)
  |
  ├── Next.js 15 + App Router
  ├── SSR Middleware (auth check)
  └── Static pages (pre-rendered)
        |
        v
Supabase (Backend)
  |
  ├── PostgreSQL (8 tabelas com RLS)
  ├── Auth (email/password)
  └── Edge Function: groq-analysis
        |
        v
      Groq API (LLM)
```

---

## Checklist Final

- [ ] Vercel importou o projeto com Root Directory `apps/painel-cfo`
- [ ] Framework Preset: Next.js
- [ ] Env vars configuradas (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Build passou sem erros
- [ ] Login funciona
- [ ] Dashboard carrega (mesmo vazio)
- [ ] URL do Vercel adicionada nas Redirect URLs do Supabase Auth
- [ ] Dominio customizado configurado (opcional)
