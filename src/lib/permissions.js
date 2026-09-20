
export const PERMISSIONS = [
  { group: 'Catálogo', rows: [
    ['Ver produtos', [1, 1, 1, 1]],
    ['Cadastrar e editar produtos', [0, 1, 1, 1]],
    ['Excluir produtos', [0, 0, 1, 1]],
    ['Editar categorias e atributos', [0, 0, 1, 1]],
    ['Importar planilha', [0, 1, 1, 1]],
  ]},
  { group: 'Estoque', rows: [
    ['Consultar saldo da rede', [1, 1, 1, 1]],
    ['Registrar venda', [1, 1, 1, 1]],
    ['Registrar troca e devolução', [1, 1, 1, 1]],
    ['Registrar entrada de compra', [0, 1, 1, 1]],
    ['Transferir entre lojas', [0, 1, 1, 1]],
    ['Ajustar inventário', [0, 1, 1, 1]],
    ['Aplicar desconto acima do limite', [0, 0, 1, 1]],
  ]},
  { group: 'Relatórios', rows: [
    ['Relatório de vendas', [0, 1, 1, 1]],
    ['Relatórios financeiros e lucro', [0, 0, 1, 1]],
    ['Exportar dados', [0, 0, 1, 1]],
  ]},
  { group: 'Administração', rows: [
    ['Gerenciar fornecedores', [0, 1, 1, 1]],
    ['Criar promoções', [0, 1, 1, 1]],
    ['Gerenciar usuários', [0, 0, 0, 1]],
    ['Editar branding e dados da empresa', [0, 0, 0, 1]],
    ['Gerenciar unidades da rede', [0, 0, 0, 1]],
    ['Ver e alterar assinatura', [0, 0, 0, 1]],
  ]},
];
