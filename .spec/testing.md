# Testes — contrato congelado

## O que tem cobertura, e por quê

**Unitário (Vitest + React Testing Library, `npm run test`)** — só
`src/lib/*` e `src/hooks/*`: `brl`, `unitLabel`, `catById`, `planEconomics`,
`annualSavings`, `colorHex`, `isColorValue`, `variantLabel`, `useNavigate`,
mais 2 smoke tests de primitivo (`Modal`, `Field`). Esse é o único código do
repo com lógica de negócio real — o resto é composição apresentacional
sobre dado mockado. Arquivo de teste fica colocado ao lado do fonte
(`*.test.ts`/`*.test.tsx`), nunca numa pasta `test/` separada.

**E2E (Playwright, `npm run test:e2e`)**:
- `e2e/all-routes-smoke.spec.ts` — deriva a lista de rotas andando por
  `src/app` em busca de `page.tsx` (nunca hardcoded — um script assim já
  apodreceu uma vez durante a restruturação anterior) e confere HTTP 200 +
  zero `console.error` em cada uma das 110 rotas.
- 7 specs de jornada: `landing-to-pricing`, `signup`, `login`,
  `dashboard-nav`, `product-catalog`, `pos-sale`, `settings-page`.

Roda contra o build de produção (`webServer` do `playwright.config.ts` faz
`npm run build && npm run start`), não `next dev` — pega regressão que só
aparece no SSG.

## O que NÃO tem cobertura, deliberadamente

As ~230 telas de `src/features/`. São composições apresentacionais com
dado mockado hardcoded — testar unitariamente cada uma quebra a cada edição
de conteúdo (texto, mock) e não pega bug real de lógica (não há lógica ali,
só JSX + dado). O smoke e2e já garante que toda rota carrega sem erro; as
7 jornadas cobrem os fluxos de usuário mais prováveis de quebrar.

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
