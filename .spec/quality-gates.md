# Quality gates — contrato congelado

Portões inegociáveis antes de considerar qualquer mudança pronta:

1. `npx eslint .` sai com código 0 — **zero erros, zero warnings.** As
   regras do React Compiler (`react-hooks/static-components`,
   `set-state-in-effect`, `immutability`, `purity`) são erro, não warning —
   não silenciar com `eslint-disable`, corrigir a causa (ver padrões em
   `.spec/architecture.md` e o histórico de correções desta revisão:
   componente inline definido dentro de render vira componente hoisted;
   `setState` em efeito de sincronizar prop vira ajuste durante render;
   acumulador mutado em `.map()` vira `reduce`).
2. `next build` passa limpo — build de produção, não só `next dev`.
3. `npx vitest run` verde.
4. `npx playwright test` verde.
5. `npx storybook build` sai sem erro (as ~40 stories do design system
   continuam montando).

Nenhum desses 5 pode ser pulado ou enfraquecido (ex.: reduzir regra de
erro pra warning, remover um teste que passou a falhar em vez de corrigir
o código) sem autorização explícita do desenvolvedor — ver `CLAUDE.md`.

## Follow-up já registrado (não é dívida silenciosa)

- `.spec/quality-gates.md` (este arquivo): reauditar `src/features/**` com
  `vercel-react-best-practices` quando o Supabase substituir o mock por
  fetch real — categorias de waterfalls/data-fetching não se aplicam hoje.
- `.spec/design-system.md`: decisão de manter estilo inline + CSS utilitário
  em vez de Tailwind-first é deliberada, não pendência.
