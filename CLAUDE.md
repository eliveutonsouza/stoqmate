@AGENTS.md

## Contrato travado (.spec/)

A pasta `.spec/` é o contrato congelado deste projeto: arquitetura de
pastas (`architecture.md`), tabela de rotas (`routing.md`), limites do
design system (`design-system.md`), cobertura de teste (`testing.md`) e
portões de qualidade (`quality-gates.md`).

- Mudanças que alterem algo descrito em `.spec/` exigem autorização
  explícita do desenvolvedor ANTES de qualquer edição — não é opcional.
- Se um pedido implicar violar `.spec/` (mudar estrutura de pastas,
  adicionar rota fora da tabela, misturar `features/` com `components/`,
  pular um quality gate, enfraquecer uma regra de lint de erro pra
  warning), pare e pergunte. Não cumpra silenciosamente, não recuse
  silenciosamente — explique o conflito e peça autorização.
- Fora de `.spec/`, trabalhe normalmente.
