"use client";


export const NOTIFS = [
  { id: 1, type: 'danger', icon: 'Alert', title: '7 SKUs em ruptura', desc: 'Vaso Decorativo · Verde · Cerâmica e mais 6 itens estão com saldo zerado em Loja Centro.', time: 'há 12 min', route: '/stock', unread: true },
  { id: 2, type: 'accent', icon: 'Swap', title: 'Transferência aguardando conferência', desc: 'TRF-124 · 24 Jogos de Toalhas enviados de Loja Centro para Loja Campinas em 18/09.', time: 'há 1 h', route: '/stock/history', unread: true },
  { id: 3, type: 'warning', icon: 'Alert', title: '24 SKUs abaixo do estoque mínimo', desc: 'Concentrados em Eletrônicos e Vestuário. Vale revisar a reposição da semana.', time: 'há 3 h', route: '/products', unread: true },
  { id: 4, type: 'success', icon: 'Check', title: 'Importação concluída', desc: '1.270 produtos importados de catalogo-bonsucesso.xlsx. 14 linhas ignoradas por erro.', time: 'ontem', route: '/products/import' },
  { id: 5, type: 'info', icon: 'Tag', title: 'Promoção encerrando em 2 dias', desc: 'Semana do Áudio termina em 22/09. 84 unidades vendidas até agora.', time: 'ontem', route: '/promotions' },
  { id: 6, type: 'warning', icon: 'Activity', title: 'Divergência de inventário acima de R$ 200', desc: 'INV-05 · falta de 2 unidades de Fone Bluetooth ANC · Preto, R$ 316,00 em custo.', time: '17 set', route: '/stock/adjustment' },
  { id: 7, type: 'info', icon: 'Credit', title: 'Fatura disponível', desc: 'Plano Controle · setembro · R$ 447,00 · paga em 01/09. NFS-e 4821 enviada por email.', time: '01 set', route: '/settings/subscription' },
  { id: 8, type: 'info', icon: 'Users', title: 'Convite pendente há 5 dias', desc: 'Diego Castro ainda não aceitou o convite para o perfil Vendedor.', time: '13 set', route: '/settings/users' },
];
