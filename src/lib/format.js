// null/undefined = valor que o perfil não pode ver (custo pro vendedor) ou
// que não existe — mostra "—" em vez de derrubar a tela.
export function brl(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
