import type { HelpArticle } from "../types";
import { shot } from "../shots";

const UPDATED = "2026-09-28";

export const VENDAS: HelpArticle[] = [
  {
    slug: "venda-no-balcao",
    title: "Vender no balcão (PDV para tablet)",
    summary: "Bipe ou toque no produto, ajuste quantidades, escolha a forma de pagamento e finalize em segundos.",
    module: "vendas",
    level: "essencial",
    requires: [{ route: "/pos", level: "edit" }],
    openRoute: "/pos",
    video: { key: "pdv", seconds: 31 },
    intro: "O modo balcão foi feito para tablet e toque: botões grandes, busca por leitor de código de barras e uma forma de pagamento por venda. Para venda com cliente, pagamento dividido ou desconto por item, use a Nova venda completa.",
    steps: [
      {
        title: "Abra o modo balcão",
        body: "Em Balcão › PDV em tablet. No topo ficam a unidade e o botão Caixa.",
        shot: shot("pdv-tela", "Tela do PDV com a busca de produto"),
      },
      {
        title: "Adicione os produtos",
        body: "Bipe o código de barras ou digite nome/SKU em \"Bipe o produto ou busque por nome/SKU\" e toque no produto. As fichas de categoria filtram a grade; \"Tudo\" mostra todos. Código exato ou SKU exato entram direto no carrinho.",
        shot: shot("pdv-busca", "Busca de produto no PDV"),
      },
      {
        title: "Confira o carrinho",
        body: "Use − e + para mudar quantidades. \"Desconto\" alterna 0, 5, 10, 15 e 20% sobre o total. \"Limpar\" esvazia o atendimento.",
        shot: shot("pdv-carrinho", "Carrinho do PDV com total"),
      },
      {
        title: "Escolha o pagamento e finalize",
        body: "Toque em Dinheiro, PIX, Débito, Crédito ou Outro e em \"Cobrar e finalizar\". O Stoqmate registra como o cliente pagou — o dinheiro passa pela maquininha ou pelo PIX da própria loja.",
        shot: shot("pdv-pagamento", "Formas de pagamento do PDV"),
        warn: "O botão fica bloqueado se faltar saldo de algum item ou se for pagamento em Dinheiro com o caixa fechado (quando o controle de caixa está ligado).",
      },
    ],
    faq: [
      { q: "Posso identificar o cliente no PDV?", a: "Não. Para vender com cliente (crédito da loja, histórico), use Balcão › Venda no desktop." },
      { q: "Consigo dividir em duas formas de pagamento?", a: "No PDV, não. A Nova venda completa aceita até 6 formas na mesma venda." },
    ],
    related: ["venda-completa", "caixa-abrir-fechar", "recibo-e-historico"],
    keywords: ["pdv", "balcao", "vender", "tablet", "caixa", "leitor", "bipar"],
    updatedAt: UPDATED,
  },
  {
    slug: "venda-completa",
    title: "Nova venda com cliente, desconto e pagamento dividido",
    summary: "A venda completa do desktop: desconto por item e no total, cliente, crédito da loja, parcelas e aprovação do gestor.",
    module: "vendas",
    level: "essencial",
    requires: [{ route: "/stock/sale", level: "edit" }],
    openRoute: "/stock/sale",
    video: { key: "venda", seconds: 41 },
    steps: [
      {
        title: "Monte o carrinho",
        body: "Em Balcão › Venda no desktop (ou tecla V no dashboard), busque cada produto. O preço já vem com a promoção ativa (o original aparece riscado). Ajuste Qtd e Desc.% por linha.",
        shot: shot("venda-produtos", "Carrinho da nova venda"),
      },
      {
        title: "Identifique o cliente (opcional)",
        body: "Em Cliente, busque por nome, CPF/CNPJ ou telefone. Sem cliente, a venda é para consumidor final. Com cliente, o app mostra o crédito em loja disponível.",
        shot: shot("venda-cliente", "Cliente selecionado com crédito em loja"),
      },
      {
        title: "Dê desconto no total, se precisar",
        body: "\"Desconto no total\" abre a escolha entre Percentual (%) e Valor fixo (R$), com o total final calculado.",
        shot: shot("venda-desconto", "Janela de desconto no total"),
        warn: "Desconto acima de 20% do valor bruto pede \"Aprovação do gestor\": um Gestor Financeiro ou Proprietário informa email e senha. A aprovação vale só para aquela venda e até o percentual aprovado.",
      },
      {
        title: "Registre o pagamento",
        body: "Escolha a forma: Dinheiro, PIX, Débito, Crédito (1 a 12 parcelas), Crédito da loja (precisa de cliente com saldo) ou Outro. \"Dividir em outra forma\" permite até 6 formas; a soma tem que fechar o total. Em Dinheiro, informe o Valor recebido para ver o Troco.",
        shot: shot("venda-pagamento", "Pagamento dividido em duas formas"),
      },
      {
        title: "Confirme",
        body: "\"Confirmar venda\" baixa o estoque da unidade e abre o recibo. Se faltar saldo, o app oferece um atalho para transferir de outra loja.",
        shot: shot("venda-confirmar", "Botão Confirmar venda com o total"),
      },
    ],
    related: ["venda-no-balcao", "recibo-e-historico", "clientes-e-credito", "caixa-abrir-fechar"],
    keywords: ["venda", "desconto", "parcelar", "pagamento dividido", "cliente", "credito da loja", "aprovacao"],
    updatedAt: UPDATED,
  },
  {
    slug: "caixa-abrir-fechar",
    title: "Abrir, movimentar e fechar o caixa",
    summary: "Valor inicial da gaveta, suprimento, sangria, contagem por cédula e justificativa de diferença.",
    module: "vendas",
    level: "essencial",
    requires: [{ route: "/cash" }],
    openRoute: "/cash",
    video: { key: "caixa", seconds: 34 },
    intro: "O controle de caixa por turno é opcional e é ligado em Configurações › Dados da empresa. Com ele desligado, a tela Caixa só mostra um aviso.",
    steps: [
      {
        title: "Abra o caixa",
        body: "Em Balcão › Fechamento de caixa, sem caixa aberto na unidade, informe o Valor inicial da gaveta e clique em \"Abrir caixa\". Só pode haver um caixa aberto por unidade.",
        shot: shot("caixa-abrir", "Tela de abrir caixa"),
      },
      {
        title: "Registre suprimento e sangria",
        body: "Durante o turno, \"Suprimento\" registra dinheiro que entrou na gaveta (ex.: troco) e \"Sangria\" o que saiu (ex.: depósito). Informe Valor e uma Observação.",
        shot: shot("caixa-sangria", "Janela de sangria de caixa"),
      },
      {
        title: "Conte a gaveta por cédula",
        body: "No fechamento, preencha a quantidade de cada cédula e moeda. O app compara o esperado com o contado e mostra Falta ou Sobra.",
        shot: shot("caixa-contagem", "Contagem da gaveta por cédula"),
      },
      {
        title: "Justifique a diferença e feche",
        body: "Com diferença, escolha o Motivo e escreva o Detalhamento (mínimo 10 caracteres) — o gestor é avisado. Clique em \"Fechar caixa e encerrar turno\".",
        shot: shot("caixa-fechamento", "Resumo do turno no fechamento de caixa"),
        warn: "Turno fechado não aceita lançamento retroativo. Um erro descoberto depois é corrigido no turno seguinte.",
      },
    ],
    related: ["venda-no-balcao", "dados-da-empresa", "notificacoes"],
    keywords: ["caixa", "gaveta", "sangria", "suprimento", "fechamento", "turno", "troco"],
    updatedAt: UPDATED,
  },
  {
    slug: "recibo-e-historico",
    title: "Recibo da venda e onde encontrar vendas antigas",
    summary: "O recibo de 80 mm, os próximos passos e como achar uma venda no histórico.",
    module: "vendas",
    level: "essencial",
    requires: [{ route: "/receipt" }, { route: "/stock/history" }],
    openRoute: "/stock/history",
    steps: [
      {
        title: "Recibo logo após a venda",
        body: "Depois de confirmar, o app mostra \"Venda #… registrada\" e o recibo de 80 mm. Botões: Próximo atendimento, Ver as vendas no histórico e Conferir caixa do turno.",
        shot: shot("venda-recibo", "Recibo da venda registrada"),
        warn: "O recibo não é documento fiscal.",
      },
      {
        title: "Encontre vendas antigas",
        body: "Em Estoque › Histórico, filtre a aba Venda e busque pelo produto. Clique na linha para ver o detalhe; em vendas aparecem \"Ver recibo\" e \"Registrar devolução\".",
        shot: shot("historico-lista", "Histórico de movimentações"),
      },
    ],
    related: ["venda-completa", "devolucao", "historico-de-movimentacoes"],
    keywords: ["recibo", "cupom", "comprovante", "venda antiga", "reimprimir"],
    updatedAt: UPDATED,
  },
  {
    slug: "clientes-e-credito",
    title: "Clientes e crédito em loja",
    summary: "Cadastre clientes, veja o histórico de compras e ajuste o crédito em loja.",
    module: "vendas",
    level: "essencial",
    requires: [{ route: "/customers" }, { route: "/customers/detail" }],
    openRoute: "/customers",
    steps: [
      {
        title: "Veja a lista de clientes",
        body: "Em Balcão › Clientes estão total gasto, compras e crédito de cada cliente. O filtro \"Com crédito em loja\" mostra quem tem saldo.",
        shot: shot("clientes-lista", "Lista de clientes"),
      },
      {
        title: "Cadastre um cliente",
        body: "\"Cadastrar cliente\" pede só Nome ou razão social; CPF ou CNPJ, Telefone, Email e Observações são opcionais.",
        shot: shot("clientes-novo", "Janela de cadastro de cliente"),
      },
      {
        title: "Abra a ficha e ajuste o crédito",
        body: "Na ficha ficam o extrato de crédito (sem validade), o histórico de compras e o que o cliente costuma comprar. \"Ajustar crédito\" permite Crédito manual, Devolução ou Retirada de crédito. \"Nova venda\" já abre a venda com o cliente.",
        shot: shot("clientes-credito", "Janela de ajuste de crédito em loja"),
      },
    ],
    related: ["venda-completa", "troca", "devolucao"],
    keywords: ["cliente", "cpf", "credito", "vale", "fiado", "historico de compras"],
    updatedAt: UPDATED,
  },
];
