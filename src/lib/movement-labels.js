// Nome de cada tipo de movimentação de estoque. Fonte única pro chip da
// tela (movement-types.js) e pros CSVs gerados no servidor.
export const MOVEMENT_LABELS = {
  sale: 'Venda',
  entry: 'Entrada',
  return: 'Devolução',
  exchange: 'Troca',
  transfer: 'Transferência',
  adjustment: 'Ajuste',
  count: 'Contagem',
};

export const movementLabel = (kind) => MOVEMENT_LABELS[kind] ?? kind;
