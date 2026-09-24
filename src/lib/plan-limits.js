// Reconhece o erro de limite de plano vindo do banco (trigger de SKU,
// fn_team_invite, fn_create_store) e devolve qual limite estourou, pra
// action mandar pra /limit-reached em vez de mostrar a mensagem crua.
export function limitKindFromError(message) {
  if (!message) return null;
  if (message.includes('limit_reached:skus')) return 'skus';
  if (message.includes('Seu plano permite') && message.includes('usuários')) return 'users';
  if (message.includes('Seu plano permite') && message.includes('lojas')) return 'stores';
  return null;
}
