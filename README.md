# Stoqmate

Controle de estoque multi-loja com IA para qualquer categoria de produto —
o lojista define as categorias do próprio ramo, o sistema gera os SKUs a
partir delas, avisa antes de faltar e lê nota fiscal de fornecedor por foto.

Em produção: https://stoqmate.vercel.app

> **Status**: em produção, com backend real no Supabase (auth, banco com
> RLS, storage, edge functions), assinatura via Stripe e IA via modelo de
> linguagem. A arquitetura de pastas, a tabela de rotas e os limites do
> design system estão congelados em [`.spec/`](.spec/) — leia antes de
> propor mudança estrutural.

## O que o produto faz

- **Catálogo**: produtos com SKU gerado pelos atributos da categoria,
  importação por planilha, preço em lote, etiquetas com código de barras e
  locais de estoque.
- **Balcão (PDV)**: caixa, pagamento dividido, recibo e clientes.
- **Estoque**: entrada, venda, troca, devolução, ajuste, contagem pelo
  celular e transferência entre lojas, com histórico completo.
- **Operação**: pedidos de compra, fornecedores, promoções e conferência da
  nota contra o pedido.
- **IA**: pergunta em linguagem natural, classificação e enriquecimento de
  cadastro, previsão de reposição e leitura de nota fiscal (foto ou PDF).
  Cobrada por créditos, com estorno se a chamada falhar.
- **Relatórios**: vendas, categorias, atributos, lucratividade e curva ABC.
- **Configurações**: empresa, unidades, usuários, 4 perfis de acesso
  (vendedor, gestor de estoque, gestor financeiro, proprietário),
  auditoria, assinatura e créditos.
- **Console da plataforma** (`/admin`): empresas, planos, assinaturas,
  crescimento, retenção e custo da IA.

Planos: **Balcão**, **Controle** e **Rede** (`src/lib/plans.js`; o banco
sobrescreve preço e limites).

## Stack

- **Next.js 16** — App Router, Server Components, Server Actions, Turbopack
- **React 19**
- **TypeScript 5** — `strict: true`, `allowJs: true` (código herdado do
  protótipo ainda é `.js`/`.jsx`; código novo nasce em `.ts`/`.tsx`)
- **Tailwind v4** — coexiste com `src/app/design-system.css`, uma folha de
  utilitários própria (`.btn`, `.card`, `.badge`, variáveis CSS de tema)
- **Supabase** — Postgres com RLS por empresa, Auth (e-mail, Google e 2FA
  TOTP), Storage, `pg_cron` e Edge Functions em Deno
- **Stripe** — assinatura, Customer Portal e compra de pacotes de crédito
- **Modelo de linguagem** — API da Anthropic (`src/lib/anthropic.ts`),
  chamada só no servidor
- **Resend** — e-mails transacionais
- **Vercel** — hospedagem do app
- **Testes** — Vitest + Testing Library, Playwright, Storybook
- **ESLint 9** (flat config) com as regras do React Compiler

## Estrutura de pastas

```
src/
  app/                 rotas do App Router — 113 páginas em 5 grupos:
                        (marketing) (auth) (store) (admin) (system).
                        Todo page.tsx é fino: importa 1 componente de
                        src/features e renderiza. Tabela em .spec/routing.md
  components/
    ui/                primitivos do design system (Modal, Field, Toolbar...)
    layout/            chrome de navegação (sidebars, header, page header)
    domain/            átomos de negócio reutilizáveis (DonutChart,
                        StoreAvatar, PlanBadge...)
  features/<dominio>/  telas por domínio (products, stock, pos, ai, billing,
                        admin...) + queries.ts (leitura, Server Component) e
                        actions.ts ("use server", mutação)
  lib/                 lógica pura (plans, permissions, format, validation...)
                        e clientes de servidor (supabase/, anthropic.ts,
                        stripe.ts, email.ts)
  hooks/               hooks compartilhados
supabase/
  migrations/          SQL append-only — nunca editar migration aplicada
  functions/           stripe-webhook, tenant-retention (purga LGPD)
e2e/                   testes Playwright
.spec/                 contrato: arquitetura, rotas, design system,
                        testes e portões de qualidade
```

**Convenções** (detalhadas em `.spec/architecture.md`):
- Direção de dependência única: `app` → `features` → `components` → `lib`.
- Nenhum arquivo `index.ts` de re-export — sempre importar o arquivo concreto.
- Alias `@/*` → `./src/*`; kebab-case nos arquivos.
- Toda tabela de domínio tem RLS; função `security definer` valida o tenant
  de todo id recebido do cliente.
- A IA só interpreta e classifica; soma e contagem são feitas no Postgres ou
  no TypeScript sobre dado real.

## Rodando o projeto

Pré-requisitos: Node 22 e um projeto Supabase (local ou na nuvem) com as
migrations de `supabase/migrations` aplicadas.

```bash
npm install
cp .env.example .env.local   # preencha as chaves (ver comentários no arquivo)
npm run dev                  # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run build` / `start` | build e servidor de produção |
| `npm run lint` | ESLint — zero erros e zero warnings é obrigatório |
| `npm run test` | Vitest — `src/lib` e `src/hooks` |
| `npm run test:e2e` | Playwright — desktop, mobile e tablet |
| `npm run storybook` | catálogo do design system (porta 6006) |
| `npm run db:types` | regenera `src/lib/supabase/database.types.ts` |

Segredos nunca entram no repositório: as chaves vão no `.env.local` e na
Vercel; as da Edge Function da Stripe, nos secrets do Supabase.

## Testes e CI

Cobertura delimitada de propósito — detalhes em
[`.spec/testing.md`](.spec/testing.md):

- **Unitário**: lógica pura de `src/lib` e `src/hooks` (planos, permissões,
  validação, CSP, CSV, upload, erros...).
- **E2E**: smoke de todas as rotas (200 + zero `console.error`), jornadas
  (cadastro, login com 2FA, venda no balcão, venda pelo estoque, catálogo,
  configurações, admin) e responsividade em mobile e tablet.

O GitHub Actions (`.github/workflows/ci.yml`) roda em todo PR: ESLint sem
warning, `tsc`, Vitest e build do Storybook; com os secrets do projeto de
teste configurados, também o build de produção e o Playwright. Um segundo
workflow faz backup diário criptografado do banco.

## Deploy

- **App**: a Vercel publica a cada merge na `main`.
- **Banco**: migrations em `supabase/migrations`, aplicadas em ordem.
- **Edge Functions**: `supabase functions deploy`.

## Processo

Trabalho planejado no **Linear**: cada funcionalidade nasce de um PRD
(documento de requisitos do produto) e vira issues; cada issue é entregue em
um ramo próprio e integrada por pull request com o CI verde. O produto foi
construído em duas etapas: protótipo navegável de todas as telas com dado
simulado e, depois, integração com o backend em fases, um domínio por vez.

## Contrato travado

Arquitetura, rotas e design system estão travados em `.spec/` — mudança
estrutural exige autorização do desenvolvedor antes de qualquer edição
(regra em `CLAUDE.md`). Fora disso, à vontade.
