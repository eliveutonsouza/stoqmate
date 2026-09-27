# Rotas — contrato congelado

Fonte da verdade: `src/app/**/page.tsx`. 113 rotas em 5 route groups. Rota
nova entra nesta tabela no mesmo commit que adiciona o `page.tsx` — não é
opcional. (`/settings/billing` removida em 2026-09-21: duplicava
`/settings/subscription`, que já usa Stripe Customer Portal real —
autorizado pelo dev. `/terms` e `/privacy` adicionadas em 2026-09-26: textos
legais exigidos pela LGPD e linkados no aceite do cadastro — autorizado pelo
dev.)

Até a Fase 1 do backend Supabase, todas as rotas eram SSG (100% estático,
sem dado dinâmico). Isso mudou a partir da Fase 2: toda rota cujo
`page.tsx` vira Server Component lendo Supabase (cookies de sessão) passa a
ser `ƒ` (dinâmica, renderizada por requisição) — esperado e correto, não
regressão. Rotas que ainda não foram "backendizadas" continuam `○`
(estático) até a fase que as tocar.

Mudar o agrupamento (mover uma rota de grupo, criar um grupo novo) exige
autorização do desenvolvedor (ver `CLAUDE.md`).

## `(marketing)` — público, sem chrome de app

`/`, `/pricing`, `/terms`, `/privacy`

## `(auth)` — público, fluxo de conta

`/signup`, `/login`, `/login/admin`, `/forgot-password`, `/reset-password`,
`/invite`, `/checkout`, `/onboarding`, `/verify-email`, `/trial-ended`,
`/complete-signup`

`/complete-signup` é a única rota de `(auth)` que **exige sessão**. Ela está
em `OPEN_ROUTES` (nenhum perfil RBAC é barrado), mas `src/proxy.ts` a trata
como exceção via `NEEDS_SESSION` e exige usuário logado. Existe porque o
login com Google entrega um usuário autenticado sem tenant — o OAuth não
coleta nome da loja, CNPJ nem plano, que `fn_complete_signup` exige. Quem já
tem tenant é redirecionado pra `/dashboard` pelo próprio `page.tsx`.

## `(store)` — autenticado, `StoreShell`

```
/dashboard  /search  /notifications  /profile  /first-run  /help
/categories  /labels  /exports  /network  /cash  /receipt  /pos
/products  /products/new  /products/edit  /products/detail
/products/import  /products/pricing
/mobile/count  /mobile/capture
/ai  /ai/queue  /ai/anomalies  /ai/forecast  /ai/enrich  /ai/credits-empty
/customers  /customers/detail
/purchase-orders  /purchase-orders/new
/suppliers  /suppliers/new  /suppliers/edit  /suppliers/detail
/promotions  /promotions/new  /promotions/edit
/shelves  /shelves/new  /shelves/edit
/stock  /stock/entry  /stock/entry/ocr  /stock/sale  /stock/transfer
/stock/transfer/receive  /stock/exchange  /stock/return  /stock/adjustment
/stock/count  /stock/history  /stock/movement  /stock/receive/match
/reports  /reports/sales  /reports/categories  /reports/attributes
/reports/profit  /reports/abc
/settings  /settings/branding  /settings/store-data  /settings/units
/settings/users  /settings/roles  /settings/audit  /settings/fiscal
/settings/notifications
/settings/subscription  /settings/subscription/change
/settings/subscription/annual  /settings/subscription/cancel
/settings/subscription/invoice  /settings/credits
/billing/past-due  /account/cancelled  /limit-reached
```

## `(admin)` — autenticado, `AdminShell`

```
/admin  /admin/stores  /admin/stores/new  /admin/stores/edit
/admin/stores/detail  /admin/plans  /admin/plans/new  /admin/plans/edit
/admin/economics  /admin/subscriptions  /admin/subscriptions/detail
/admin/users  /admin/reports  /admin/ai-monitoring  /admin/settings
```

## `(system)` — estados de erro/preview

`/error`, `/offline`, `/session-expired`, `/access-denied`. O 404 é
`src/app/not-found.tsx` (o Next reserva o path literal `/404`); a antiga
vitrine `/404-demo` saiu na auditoria de 2026-09-27, com autorização.

## Route Handlers técnicos (não contam nas 113 rotas — não são `page.tsx`)

`src/app/auth/callback/route.ts` — troca o `code` de um link de email (reset
de senha) ou do OAuth do Google por uma sessão via cookie. Nunca renderiza
UI, só redireciona; fora de qualquer route group. Depois da troca, manda pra
`/complete-signup` quem está sem tenant e não é staff da plataforma (staff
legitimamente não tem tenant, então fica de fora da regra).

## Regras

- Toda página é um `page.tsx` fino: `import { X } from '@/features/.../x'; export default function Page() { return <X />; }`. Props estáticas (`mode="edit"`) só quando o componente de fato as declara.
- `navigate` nunca é prop de rota — cada componente de rota chama
  `useNavigate()` (`src/hooks/use-navigate.ts`) internamente.
- Nenhuma rota dinâmica (`[id]`) existe ainda — o mock não tem IDs reais.
  Isso muda quando o Supabase entrar (revisão autorizada deste documento).
