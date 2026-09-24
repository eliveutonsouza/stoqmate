# Design system — contrato congelado

Catálogo vivo: `npm run storybook` (`.storybook/main.ts`,
`.storybook/preview.tsx`). O preview importa `src/app/design-system.css` e
roda `applyTheme(TWEAK_DEFAULTS)` uma vez — sem isso toda story renderiza
com as CSS custom properties (`--accent`, `--bg`, etc.) vazias.

## Escopo do catálogo

**Só `src/components/ui/`, `src/components/layout/` e
`src/components/domain/`** (~41 arquivos, uma story por componente em
`*.stories.tsx` colocado ao lado do componente). As ~230 telas de
`src/features/` **não entram no catálogo** — são composições de página
específicas, não primitivos reutilizáveis. Catalogar uma tela ali só
re-renderizaria a página inteira com mock, o que o smoke e2e
(`.spec/testing.md`) já cobre melhor, num browser de verdade, contra a
rota real.

## Fronteira entre as 3 pastas

- `components/ui/` — primitivos genéricos, sem forma de negócio (Modal,
  Field, TextInput, Toolbar, StoreShell, CommandPalette...).
- `components/layout/` — chrome de navegação (sidebars, headers, o grid de
  `SettingsLayout`).
- `components/domain/` — átomos com forma de negócio mas reutilizáveis
  entre 2+ domínios de `features/` (DonutChart, StoreAvatar, PlanBadge,
  StatusBadge, CreditMeter, Sparkline, MiniAreaChart, HubCard,
  MetricsRow, ReportHeader, ReportTabs).

Um componente só entra em `domain/` quando pelo menos 2 domínios de
`features/` o consomem — caso contrário ele é local à feature que o usa
(dentro do próprio arquivo da tela, ou vizinho a ela na mesma pasta).

## Estilo

Não é Tailwind-first: a maioria dos componentes usa `style={{}}` inline +
classes utilitárias de `src/app/design-system.css` (`.btn`, `.card`,
`.badge`...) e variáveis CSS de tema. Tailwind está instalado
(`src/app/globals.css`) mas raramente usado diretamente nos componentes
existentes — não migrar isso silenciosamente para Tailwind puro; é decisão
de design, não bug.

## Responsividade

O app inteiro (site público, loja e console admin) funciona de 375px pra
cima. Breakpoints: **1080px** (telas médias perdem colunas), **900px**
(tablet: sidebar vira drawer, layouts com painel lateral empilham),
**640px** (celular: grids e formulários em 1 coluna).

- **Layout que muda com a largura é classe, nunca `style={{}}`.** Estilo
  inline vence classe e não aceita media query. As classes ficam em
  `src/app/design-system.css`, bloco "Responsividade":
  - grids: `.g2`–`.g5`, `.kpi-strip` (faixa de KPIs; separador vem do
    gap, nunca de `borderRight` por item);
  - painel lateral: `.split-2`, `.split-aside`, `.split-nav`, com largura
    via CSS var (`--aside`, `--nav`, `--a`/`--b`). Filho sticky ganha
    `data-sticky` pra ficar estático quando empilha;
  - tabelas: `.table-scroll` (a tabela rola; nunca `overflow: hidden`
    cortando coluna);
  - formulários: `.form-grid` (dentro do `FormCard`);
  - shell: `.app-shell`/`.app-sidebar` (via `AppFrame`, em
    `components/layout/app-frame.jsx`);
  - helpers: `.hide-tablet`/`.show-tablet`/`.hide-mobile`/`.show-mobile`.
- As regras são **container queries** (`@container app (...)`), não media
  queries. O `body` é o container `app`, então no app vale a largura da
  tela. Os prints da landing (`ShowcaseFrame`) abrem um container `app`
  próprio na largura de desenho (1380px), e a tela lá dentro fica sempre
  no layout desktop, mesmo com o visitante no celular. Regra nova de
  responsividade do app usa `@container app`; só a landing (`.lp-*`, que
  nunca aparece dentro de print) usa `@media`.
- Espaçamento lateral de página: token `--page-pad` (`.page-pad`).
- `useMediaQuery` (`src/hooks/use-media-query.ts`) só quando a
  **estrutura** muda (ex.: `PhoneFrame` com moldura no desktop, tela cheia
  no celular). Refluxo de layout é CSS puro.
- Objeto de tamanho fixo escalado (preview de tela, filme do hero) usa
  `useFitScale`: `transform: scale` sozinho não reduz a caixa de layout.
  O print encolhe no celular, mas mostra o desktop (decisão do produto).
- Telas "de dispositivo" (`/mobile/*`, `/pos`) são prévia com moldura no
  desktop e ocupam o aparelho de verdade abaixo de 640px (PDV: até 1024px).

## Mudar essa fronteira exige autorização

Mover um componente entre `ui/`/`layout/`/`domain/`/`features/`, ou decidir
migrar o estilo pra Tailwind-first, é mudança de contrato — ver `CLAUDE.md`.
