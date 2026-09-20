# Rotas — contrato congelado

Fonte da verdade: `src/app/**/page.tsx`. 110 rotas em 5 route groups,
todas estaticamente prerenderizadas (`next build` gera 100% SSG hoje —
sem dado dinâmico real ainda). Rota nova entra nesta tabela no mesmo
commit que adiciona o `page.tsx` — não é opcional.

Mudar o agrupamento (mover uma rota de grupo, criar um grupo novo) exige
autorização do desenvolvedor (ver `CLAUDE.md`).

## `(marketing)` — público, sem chrome de app

`/`, `/pricing`

## `(auth)` — público, fluxo de conta

`/signup`, `/login`, `/login/admin`, `/forgot-password`, `/reset-password`,
`/invite`, `/checkout`, `/onboarding`, `/verify-email`, `/trial-ended`

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
/settings/users  /settings/roles  /settings/audit  /settings/notifications
/settings/subscription  /settings/subscription/change
/settings/subscription/annual  /settings/subscription/cancel
/settings/subscription/invoice  /settings/billing  /settings/credits
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

`/404-demo` (demo do design — o 404 real é `src/app/not-found.tsx`, Next
reserva o path literal `/404` pra própria máquina de erro), `/error`,
`/offline`, `/session-expired`, `/access-denied`

## Regras

- Toda página é um `page.tsx` fino: `import { X } from '@/features/.../x'; export default function Page() { return <X />; }`. Props estáticas (`mode="edit"`) só quando o componente de fato as declara.
- `navigate` nunca é prop de rota — cada componente de rota chama
  `useNavigate()` (`src/hooks/use-navigate.ts`) internamente.
- Nenhuma rota dinâmica (`[id]`) existe ainda — o mock não tem IDs reais.
  Isso muda quando o Supabase entrar (revisão autorizada deste documento).
