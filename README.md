# DevTrack

Sistema de gestão de horas e projetos para equipes de desenvolvimento.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth)
- **react-hook-form** + **zod** para validação
- **Recharts** para gráficos

## Setup

### 1. Clone e instale dependências

```bash
npm install
```

### 2. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute o arquivo `supabase-schema.sql`
3. Copie a URL e a Anon Key do projeto

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Crie o primeiro usuário (admin)

No SQL Editor do Supabase, após criar o usuário via Auth:

```sql
update profiles set role = 'admin' where id = '<user-uuid>';
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Perfis de usuário

| Perfil | Permissões |
|--------|-----------|
| **admin** | Vê todos os devs, todos os logs, todos os projetos, relatórios semanais |
| **dev** | Vê apenas seus próprios registros e o painel pessoal |

## Deploy no Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático a cada push na branch `main`

## Estrutura do projeto

```
app/
├── (auth)/login/         ← Página de login
├── (dashboard)/
│   ├── layout.tsx        ← Sidebar + autenticação
│   ├── page.tsx          ← Dashboard admin
│   ├── projects/         ← CRUD de projetos
│   ├── logs/             ← Registro de horas
│   ├── reports/          ← Relatório semanal
│   └── my/               ← Painel do dev
components/
├── ui/                   ← Componentes primitivos
├── layout/               ← Sidebar, Topbar
├── projects/             ← Componentes de projeto
├── logs/                 ← Formulário e tabela de logs
└── reports/              ← Gráfico e relatório semanal
lib/
├── supabase/             ← Clientes client/server/middleware
├── types.ts              ← Tipos TypeScript
└── utils.ts              ← Utilitários de data/horas
proxy.ts                  ← Proteção de rotas (Next.js 16)
supabase-schema.sql       ← Schema + RLS completo
```
