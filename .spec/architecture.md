# Arquitetura — contrato congelado

Este documento descreve a estrutura de pastas do Stoqmate. É contrato: mudar
o que está aqui exige autorização explícita do desenvolvedor antes de
qualquer edição (regra completa em `CLAUDE.md`).

## Camadas e limites de dependência

```
src/app/          rotas do App Router — só routing, nada de lógica própria
src/components/   design system (ui, layout, domain)
src/features/     composições de tela, por domínio de negócio
src/lib/          dados e lógica pura (mock, pricing, formatação, tema)
src/hooks/        hooks compartilhados
```

**Direção de dependência é única, sem exceção:**
`app` → `features` → `components` → `lib`

- `components/*` **nunca** importa de `features/*`. Um primitivo de design
  system não pode depender de uma composição de página. (Violação encontrada
  e corrigida durante o hardening: `MetricsRow` e `ReportTabs` importavam de
  `features/dashboard` e `features/reports` — o componente `Sparkline` foi
  promovido para `components/domain/` e a constante `REPORT_TABS` foi
  colocada dentro do próprio `components/domain/report-tabs.jsx`.)
- `app/**/page.tsx` é sempre um arquivo fino: importa 1 componente de
  `features/<domínio>/` e renderiza. Nenhuma lógica mora no `page.tsx`.
- Dentro de `components/`: `ui/` são primitivos genéricos (Modal, Field,
  Toolbar...); `layout/` é chrome de navegação (sidebars, headers);
  `domain/` são átomos com forma de negócio mas reutilizáveis entre domínios
  (DonutChart, StoreAvatar, CreditMeter...). Um componente de `domain/`
  pode importar de `ui/` e `layout/`, nunca o contrário.

## Convenções

- **Sem barrel imports.** Nenhum arquivo `index.ts`/`index.js` de re-export
  em lugar nenhum de `src/`. Todo import aponta pro arquivo concreto
  (`@/components/ui/modal`, nunca `@/components/ui`). Confirmado limpo
  nesta revisão (`find src -iname "index.*"` vazio).
- **Alias `@/*` → `./src/*`**, definido em `tsconfig.json`. Usar sempre o
  alias para imports cross-pasta; import relativo só dentro da mesma pasta.
- **kebab-case** em todo nome de arquivo. Nome do export (PascalCase para
  componentes, UPPER_SNAKE para constantes) não precisa bater com o nome do
  arquivo.
- **1 componente de tela por arquivo** em `features/`. Sub-componente
  privado usado só por 1 tela fica no mesmo arquivo; usado por 2+ telas do
  mesmo domínio vira arquivo próprio no mesmo domínio; usado por 2+
  domínios é promovido para `components/domain/` ou `lib/`.
- **Extensão**: código herdado do design original (a maior parte de
  `components/` e `features/`) continua `.js`/`.jsx`, sem tipagem — retipar
  em massa depois que o Supabase já entrou não paga o custo (a superfície
  é grande e estável agora, não vale reescrever só por tipo). Código novo
  (rotas, `queries.ts`/`actions.ts` de backend, hooks, specs de teste,
  stories) nasce em `.ts`/`.tsx`.

## Backend (Supabase)

Integrado por completo (Fases 0–10 do plano de migração mock→backend
real, mais a Fase 7 de IA). Camada nova:

```
src/lib/supabase/client.ts          browser client (Client Components)
src/lib/supabase/server.ts          Server Component/Server Action client
                                     (cookies via @supabase/ssr), createClient()
                                     + getTenantId()
src/lib/supabase/service-role.ts    server-only — bypassa RLS de propósito.
                                     Só para /admin/** DEPOIS de confirmar
                                     is_platform_staff() com o client normal
src/lib/anthropic.ts                cliente da API da Anthropic, server-only
src/lib/stripe.ts                   cliente do Stripe, server-only
supabase/migrations/*.sql           append-only — nunca editar uma migration
                                     já aplicada, sempre `create or replace`/
                                     `alter table` numa nova
supabase/functions/<nome>/          Edge Functions (Deno). Só usada quando
                                     quem chama é externo ao app (hoje: só
                                     stripe-webhook) — chamada de IA do
                                     próprio usuário logado é Server Action,
                                     não Edge Function
src/features/<domínio>/queries.ts   leitura, chamada só de Server Component
src/features/<domínio>/actions.ts   `"use server"` — mutação, chamada só de
                                     Client Component
```

**Direção de dependência** (estende a regra da seção anterior):
`features/*/actions.ts` e `queries.ts` podem importar
`@/lib/supabase/server` livremente. **Nunca** importar
`@/lib/supabase/service-role` fora de `src/features/admin/**` — e mesmo lá,
só depois de checar `is_platform_staff()` com o client normal (RLS-scoped)
primeiro. Um Client Component (`"use client"`) nunca importa
`@/lib/supabase/server` nem `service-role` — só chama uma `action` já
exportada de `actions.ts`.

**Autorização**: toda tabela de domínio tem RLS; toda função `security
definer` que recebe id vindo do cliente (store_id, product_id, etc.) valida
esse id contra `auth_tenant_id()` antes de usar — ela roda com privilégio
elevado, então a validação de tenant não é opcional, é a própria fronteira
de segurança. `role_area_access` espelha literalmente
`AREAS`/`ROLES`/`ACCESS` de `src/lib/permissions.js` — mudou um, muda o
outro no mesmo commit.

**IA**: 5 operações (`classify`, `ask`, `enrich`, `forecast`, `ocr`) via
`src/features/ai/actions.ts` (+ `ai-flows/actions.ts` para persistência
específica de enrich/ocr), todas com débito de crédito antes da chamada e
estorno se a Anthropic falhar (`ai_credit_ledger`, `fn_ai_debit_credits`/
`fn_ai_refund_credits`). Padrão fixo pra qualquer operação de IA nova:
o modelo só traduz/classifica, nunca soma/conta — quem faz a aritmética é
sempre o Postgres/TypeScript sobre dado real.

**Débito conhecido, não uma regressão silenciosa**: `AIQuotaCard`
(`src/features/ai/ai-quota-card.jsx`) ainda lê de `ai-constants.js`
(mock), não do saldo real (`tenants.ai_credit_balance`) — falta decidir a
política de renovação mensal de crédito (nenhum cron existe ainda) antes
de wireá-lo. Registrado como pendência, não é dívida escondida.
