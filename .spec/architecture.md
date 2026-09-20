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
  `components/` e `features/`) fica `.js`/`.jsx`, sem tipagem — não vale a
  pena tipar isso agora, o formato dos dados muda quando o Supabase entrar.
  Código novo (rotas, hooks, specs de teste, stories) nasce em `.ts`/`.tsx`.

## O que NÃO está aqui

Modelo de dados, autenticação e integrações de backend — o projeto ainda é
front-end com dado mockado (`src/lib/mock.js`, `src/lib/plans.js`). Esse
desenho vem depois, quando o Supabase for integrado, e vira uma revisão
deste documento (com autorização do desenvolvedor).
