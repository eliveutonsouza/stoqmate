# Testes — contrato congelado

## O que tem cobertura, e por quê

**Unitário (Vitest + React Testing Library, `npm run test`)** — só
`src/lib/*` e `src/hooks/*`: `brl`, `unitLabel`, `catById`, `planEconomics`,
`annualSavings`, `colorHex`, `isColorValue`, `variantLabel`, `useNavigate`,
mais 2 smoke tests de primitivo (`Modal`, `Field`), mais `animate`/`clamp`
de `src/features/landing/hero-film-engine.jsx` (puros, mesmo critério —
ver exceção pontual abaixo), mais `can`/`areaFor`/`whoCanReach`/
`auditRoutes` de `src/lib/permissions.js` — RBAC é lógica de negócio real,
mesma categoria de `planEconomics`. `auditRoutes` roda contra
`listRoutes()` (`e2e/route-list.ts`) e falha o teste se alguma rota real
ficar sem área (`missing`) ou alguma área apontar pra rota que não existe
(`phantom`) — é o guard-rail de cobertura total que o próprio
`permissions.js` exige. Esse é o código do repo com lógica de negócio
ou matemática real — o resto é composição apresentacional sobre dado
mockado. Arquivo de teste fica colocado ao lado do fonte
(`*.test.ts`/`*.test.tsx`), nunca numa pasta `test/` separada.

**E2E (Playwright, `npm run test:e2e`)**:
- `e2e/all-routes-smoke.spec.ts` — deriva a lista de rotas andando por
  `src/app` em busca de `page.tsx` (nunca hardcoded — um script assim já
  apodreceu uma vez durante a restruturação anterior) e confere HTTP 200 +
  zero `console.error` em cada uma das 113 rotas.
- 7 specs de jornada: `landing-to-pricing`, `signup`, `login`,
  `dashboard-nav`, `product-catalog`, `pos-sale`, `settings-page`.
- `hero-film.spec.ts` — cobertura específica do filme do hero
  (`src/features/landing/hero-film*.jsx`): confere que
  `prefers-reduced-motion: reduce` renderiza só o print estático (não monta
  o motor de animação) e que, sem isso, o filme monta e roda sem erro no
  console. Exceção deliberada à regra "features/ não ganha teste" — aqui
  há comportamento condicional de verdade (reduced-motion vs. animado) que
  vale a pena travar, ao contrário de uma tela apresentacional comum.

- **Responsividade** (projetos `mobile` = Pixel 7 e `tablet` = 820px no
  `playwright.config.ts`, além do desktop):
  - `responsive.spec.ts` passa por todas as rotas (mesma lista do smoke)
    e falha se algum elemento passar da largura da viewport fora de um
    scroller horizontal legítimo (`.table-scroll`, abas).
    `document.scrollWidth` NÃO serve de critério: o shell do app rola
    dentro de `[data-content-area]`, então a página nunca "rola pro
    lado" mesmo com coluna espremida ou cortada por `overflow: hidden`.
  - `mobile-nav.spec.ts`: drawer do app (abre, Esc, fecha ao navegar) e
    hamburger público.
  - `src/hooks/use-media-query.test.ts` cobre o hook de breakpoint.

Roda contra o build de produção (`webServer` do `playwright.config.ts` faz
`npm run build && npm run start`), não `next dev` — pega regressão que só
aparece no SSG.

**Backend (Supabase)** — cobertura por verificação manual disciplinada, não
suíte automatizada ainda (ver Follow-up): toda fase do backend foi fechada
só depois de (1) `supabase db push` limpo, (2) verificação ao vivo logado
como um usuário fixture real (nunca `service_role` — RLS só prova algo se
quem testa é quem a política realmente restringe), (3) o gate completo
desta página. O teste mais importante em qualquer mudança de RLS/função
`security definer` é negativo: um usuário do tenant A não pode ler nem
escrever dado do tenant B, e uma função que recebe `store_id`/`product_id`
do cliente rejeita um id de outro tenant — isso foi verificado manualmente
fase a fase (cross-tenant em `fn_stock_entry`, `fn_transfer_dispatch`,
etc.) mas ainda não virou teste automatizado que rode no CI.

## O que NÃO tem cobertura, deliberadamente

As ~230 telas de `src/features/`. São composições apresentacionais com
dado mockado hardcoded — testar unitariamente cada uma quebra a cada edição
de conteúdo (texto, mock) e não pega bug real de lógica (não há lógica ali,
só JSX + dado). O smoke e2e já garante que toda rota carrega sem erro; as
7 jornadas cobrem os fluxos de usuário mais prováveis de quebrar. A
coreografia do filme do hero (`Film`, `hero-film-scenes.jsx`,
`hero-film-pieces.jsx`) segue a mesma regra — só `animate`/`clamp` (puros)
ganham teste unitário; o resultado visual da animação é coberto pelo e2e.

## Follow-up registrado — ativo agora

O Supabase já substituiu o mock por fetch real em `src/features/**`.
Pendente (autorizado nesta revisão, ainda não feito):
1. Reauditar `src/features/**` com a skill `vercel-react-best-practices`,
   focando em "Eliminating Waterfalls" e "Server-Side Performance"
   (`React.cache()`, `Promise.all`) — ver `.spec/quality-gates.md`.
2. Testes de integração cobrindo RLS/RPC diretamente (`pgTAP` ou Vitest
   contra um projeto Supabase de teste), pra virar gate automatizado em
   vez de checklist manual — o teste mais valioso é o negativo
   cross-tenant descrito acima. Não existe hoje; verificação continua
   manual fase a fase.
3. `AIQuotaCard` mockado (ver `.spec/architecture.md`) não tem teste
   porque não lê dado real ainda — ganha cobertura junto com o wiring.

## Rodando

```bash
npm run test       # vitest run — unitário
npm run test:e2e   # playwright test — e2e (builda e sobe a app sozinho)
```
