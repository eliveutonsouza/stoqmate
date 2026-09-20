# Testes — contrato congelado

## O que tem cobertura, e por quê

**Unitário (Vitest + React Testing Library, `npm run test`)** — só
`src/lib/*` e `src/hooks/*`: `brl`, `unitLabel`, `catById`, `planEconomics`,
`annualSavings`, `colorHex`, `isColorValue`, `variantLabel`, `useNavigate`,
mais 2 smoke tests de primitivo (`Modal`, `Field`), mais `animate`/`clamp`
de `src/features/landing/hero-film-engine.jsx` (puros, mesmo critério —
ver exceção pontual abaixo). Esse é o código do repo com lógica de negócio
ou matemática real — o resto é composição apresentacional sobre dado
mockado. Arquivo de teste fica colocado ao lado do fonte
(`*.test.ts`/`*.test.tsx`), nunca numa pasta `test/` separada.

**E2E (Playwright, `npm run test:e2e`)**:
- `e2e/all-routes-smoke.spec.ts` — deriva a lista de rotas andando por
  `src/app` em busca de `page.tsx` (nunca hardcoded — um script assim já
  apodreceu uma vez durante a restruturação anterior) e confere HTTP 200 +
  zero `console.error` em cada uma das 110 rotas.
- 7 specs de jornada: `landing-to-pricing`, `signup`, `login`,
  `dashboard-nav`, `product-catalog`, `pos-sale`, `settings-page`.
- `hero-film.spec.ts` — cobertura específica do filme do hero
  (`src/features/landing/hero-film*.jsx`): confere que
  `prefers-reduced-motion: reduce` renderiza só o print estático (não monta
  o motor de animação) e que, sem isso, o filme monta e roda sem erro no
  console. Exceção deliberada à regra "features/ não ganha teste" — aqui
  há comportamento condicional de verdade (reduced-motion vs. animado) que
  vale a pena travar, ao contrário de uma tela apresentacional comum.

Roda contra o build de produção (`webServer` do `playwright.config.ts` faz
`npm run build && npm run start`), não `next dev` — pega regressão que só
aparece no SSG.

## O que NÃO tem cobertura, deliberadamente

As ~230 telas de `src/features/`. São composições apresentacionais com
dado mockado hardcoded — testar unitariamente cada uma quebra a cada edição
de conteúdo (texto, mock) e não pega bug real de lógica (não há lógica ali,
só JSX + dado). O smoke e2e já garante que toda rota carrega sem erro; as
7 jornadas cobrem os fluxos de usuário mais prováveis de quebrar. A
coreografia do filme do hero (`Film`, `hero-film-scenes.jsx`,
`hero-film-pieces.jsx`) segue a mesma regra — só `animate`/`clamp` (puros)
ganham teste unitário; o resultado visual da animação é coberto pelo e2e.

## Follow-up registrado (não fazer agora)

Quando o Supabase entrar e `src/features/**` passar a fazer fetch real de
dado (troca do mock por chamada real), duas coisas mudam nesta seção, com
autorização do desenvolvedor:
1. Reaudita `src/features/**` com a skill `vercel-react-best-practices`,
   focando nas categorias "Eliminating Waterfalls" e "Client-Side Data
   Fetching" — não se aplicam hoje porque não há fetch nenhum.
2. Cobertura unitária provavelmente precisa crescer pra cobrir hooks de
   data-fetching novos, que passam a ter lógica de verdade.

## Rodando

```bash
npm run test       # vitest run — unitário
npm run test:e2e   # playwright test — e2e (builda e sobe a app sozinho)
```
