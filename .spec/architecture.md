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
                                     quem chama é externo ao app (hoje:
                                     stripe-webhook e tenant-retention, esta
                                     disparada pelo pg_cron — purga LGPD de
                                     rede cancelada há 90 dias, 2026-10-05) — chamada de IA do
                                     próprio usuário logado é Server Action,
                                     não Edge Function
src/features/<domínio>/queries.ts   leitura, chamada só de Server Component
src/features/<domínio>/actions.ts   `"use server"` — mutação, chamada só de
                                     Client Component
```

**Direção de dependência** (estende a regra da seção anterior):
`features/*/actions.ts` e `queries.ts` podem importar
`@/lib/supabase/server` livremente. **Nunca** importar
`@/lib/supabase/service-role` fora de `src/features/admin/**` (exceções autorizadas: RPCs de servidor `*_for`/`*_svc` de IA e da fila
de email, e `src/lib/rate-limit.ts` — rate limit dos endpoints públicos,
autorizado pelo dev em 2026-10-05; nenhuma delas lê ou grava tabela de domínio) — e mesmo lá,
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

**Renovação de crédito**: cota do plano (`tenants.ai_credit_plan_balance`)
zera todo ciclo, nunca acumula; crédito extra comprado
(`ai_credit_extra_balance`) nunca é tocado pela renovação. Mecanismo é
`fn_ai_renew_cycle()` via `pg_cron` diário (não o webhook do Stripe — o
webhook nunca dispara pra tenant sem assinatura, então dependeria de dois
caminhos de código pra a mesma coisa). Troca de plano ajusta a cota na
hora via `fn_ai_apply_plan_change()`, chamada pelo webhook do Stripe.
`AIQuotaCard` e a tela `settings/credits` já leem esse saldo real, e a
compra de pacote avulso (`credit_packs`, `credit_pack_purchases`,
`fn_ai_credit_pack_purchase`) processa pagamento de verdade via Stripe
Checkout (`mode: "payment"`) — idempotente contra reentrega do webhook
por `stripe_checkout_session_id unique`.

**Histórico da plataforma**: `tenant_lifecycle_events` (signup/
plan_change/canceled/reactivated) é a fonte de coorte de retenção
(`fn_platform_cohort_retention`), crescimento mensal
(`fn_platform_growth_by_month`) e spark de MRR (`fn_platform_mrr_trend`)
no console admin. O log só existe a partir de quando foi criado — meses
anteriores aparecem zerados/vazios, não reconstruídos. Backfill de 1
evento `signup` por tenant existente (com `occurred_at` real, não
inventado) dá o primeiro ponto de dado.

**Telas de billing ligadas ao Stripe** (decisão do desenvolvedor,
2026-09-24, substitui a reserva "órfã" de 2026-09-21): `cancel-subscription`,
`plan-change`, `switch-to-annual`, `invoice-detail`, `account-cancelled`,
`past-due`, `trial-ended` (em `src/features/billing/`) e `/checkout`
(`src/features/public/checkout.jsx`) leem assinatura/faturas/planos reais
e agem via Stripe Checkout ou Customer Portal com `flow_data`
(`changePlanAction`, `cancelSubscriptionAction`,
`updatePaymentMethodAction`). Nenhuma coleta cartão no app. O proxy
(`src/lib/access-gate.ts` + `fn_session_context`) manda conta com trial
vencido, cancelada ou sem pagamento para essas telas.

**Planos nas páginas públicas**: landing, `/pricing`, `/signup` e
`/complete-signup` leem o catálogo real via `loadPublicPlans()`
(`features/public/queries.ts`), com client anon sem cookies
(`lib/supabase/public.ts`) pra landing/pricing/signup seguirem ISR
(`revalidate = 300`, e `revalidatePath` quando o admin salva plano ou
settings). O banco sobrescreve nome/textos/preço/créditos/limites/destaque
sobre o `PLANS` estático, que continua dono da ordem das 3 colunas e dos
campos que só existem lá (`FEATURE_MATRIX`, `support`, `msgs`). A copy
de trial lê `fn_platform_trial_days()` — nunca escrever "N dias grátis"
fixo em tela que tem dado do servidor.

**Limites de plano**: `limits.users` em `fn_team_invite`,
`limits.stores` em `fn_create_store` e `limits.skus` no trigger
`products_sku_limit` (só SKU ativo conta). A action que recebe esse erro
redireciona pra `/limit-reached?kind=` via `limitKindFromError`
(`lib/plan-limits.js`).

**Telas admin intencionalmente estáticas**: `admin-economics.jsx` é
calculadora de precificação sobre as constantes de `lib/plans.js` (não é
dado de tenant — não religar ao banco). `system-health-card.jsx` é
observabilidade de infra, fora do código de produto. Em
`/admin/settings`, só é real o que tem backend: `platform_settings`
(duração do trial — vira o default de `tenants.trial_ends_at` via
`fn_platform_trial_days()` —, teto e % de alerta de gasto de IA) e o
status das integrações (lido das env vars no servidor, nunca o valor da
chave). Branding de plataforma, retenção, tamanho de foto, tolerância de
inadimplência, rate limit e sessão admin aparecem desabilitados com "Em
breve" — não ganham campo no banco antes de existir código que os
aplique.

**Padrão de segurança que já mordeu duas vezes — checar em toda tabela
nova**: RLS ligado + grant concedido + ZERO policy = nega tudo pro
`authenticated`, **sem erro nenhum** pro client (a query simplesmente
volta vazia). Já aconteceu com `ai_ops` (esvaziava silenciosamente o
"onde os créditos foram") e com `platform_staff` (quebrava de verdade o
login admin — `signInAdminAction` sempre via 0 linhas e recusava staff
real). Toda tabela nova precisa OU de uma policy de select explícita OU
de uma justificativa documentada de por que ela é só lida via
`service_role`/função `security definer`.
