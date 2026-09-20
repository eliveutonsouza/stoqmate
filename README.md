# Stoqmate

Controle de estoque multi-loja com IA para qualquer categoria de produto —
o lojista define as categorias do próprio ramo, o sistema gera os SKUs a
partir delas, avisa antes de faltar e lê nota fiscal de fornecedor por foto.

> **Status**: front-end completo, com dado mockado (`src/lib/mock.js`,
> `src/lib/plans.js`). Integração com Supabase (auth, banco, edge functions)
> ainda não foi feita. A arquitetura de pastas, a tabela de rotas e os
> limites do design system estão congelados em [`.spec/`](.spec/) — leia
> antes de propor mudança estrutural.

## Stack

- **Next.js 16.3.5** — App Router, Turbopack
- **React 19.2.8**
- **TypeScript 5** — `strict: true`, `allowJs: true` (código herdado do
  design original ainda é `.js`/`.jsx`; código novo nasce em `.ts`/`.tsx`)
- **Tailwind v4** — coexiste com `src/app/design-system.css`, uma folha de
  utilitários própria (`.btn`, `.card`, `.badge`, variáveis CSS de tema);
  a maioria dos componentes usa `style={{}}` inline + essas classes, não
  Tailwind puro
- **ESLint 9** (flat config) com as regras do React Compiler
  (`eslint-config-next`)

## Estrutura de pastas

```
src/
  app/                 rotas reais do App Router — 110 páginas em 5 grupos:
                        (marketing) (auth) (store) (admin) (system).
                        Todo page.tsx é fino: importa 1 componente de
                        src/features e renderiza. Tabela completa em
                        .spec/routing.md
  components/
    ui/                primitivos genéricos do design system (Modal,
                        Field, Toolbar, StoreShell, CommandPalette...)
    layout/             chrome de navegação (sidebars, header, page header)
    domain/             átomos com forma de negócio mas reutilizáveis entre
                        domínios (DonutChart, StoreAvatar, PlanBadge...)
  features/<dominio>/    26 domínios (products, stock, billing, admin, pos,
                        landing...), 1 componente de tela por arquivo —
                        são composições de página, não catálogo
  lib/                 lógica pura e dado mockado: mock.js, plans.js,
                        format.js, attr-colors.js, catalog.js, theme.js...
  hooks/                use-navigate.ts (substitui roteamento por hash)
```

**Convenções** (detalhadas em `.spec/architecture.md`):
- Nenhum arquivo `index.ts` de re-export (barrel import) — sempre importar
  o arquivo concreto (`@/components/ui/modal`, nunca `@/components/ui`).
- Alias `@/*` → `./src/*`.
- kebab-case nos arquivos, 1 componente de rota por arquivo.
- `components/*` nunca importa de `features/*` (direção de dependência
  única: features consome components, nunca o contrário).

## Rodando o projeto

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start
npm run lint          # zero erros/warnings é obrigatório — ver .spec/quality-gates.md
npm run test          # unitário (Vitest) — src/lib e src/hooks
npm run test:e2e      # e2e (Playwright) — pasta e2e/
npm run storybook      # catálogo do design system (components/ui|layout|domain)
```

## Testes

Cobertura é deliberadamente delimitada — detalhes e motivo em
[`.spec/testing.md`](.spec/testing.md). Resumo: lógica pura de `src/lib` e
`src/hooks` tem teste unitário; as ~230 telas de `src/features` não (são
composições apresentacionais com dado mockado); todas as rotas têm smoke
e2e (200 + zero console error) mais um punhado de jornadas de usuário.

## Design system

Catalogado no Storybook (`npm run storybook`) — só `src/components/ui`,
`src/components/layout` e `src/components/domain` (~40 arquivos). Telas de
`src/features` não entram no catálogo (ver `.spec/design-system.md`).

## Contrato travado

Este projeto trava arquitetura, rotas e design system em `.spec/` — mudança
estrutural exige autorização do desenvolvedor antes de qualquer edição
(regra aplicada em `CLAUDE.md`). Fora disso, à vontade.
