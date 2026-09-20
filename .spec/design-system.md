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

## Mudar essa fronteira exige autorização

Mover um componente entre `ui/`/`layout/`/`domain/`/`features/`, ou decidir
migrar o estilo pra Tailwind-first, é mudança de contrato — ver `CLAUDE.md`.
