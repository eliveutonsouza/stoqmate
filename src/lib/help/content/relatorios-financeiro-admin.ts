import type { HelpArticle } from "../types";
import { shot } from "../shots";

const UPDATED = "2026-09-28";

export const RELATORIOS: HelpArticle[] = [
  {
    slug: "relatorios-e-exportacao",
    title: "Relatórios: período, loja e exportação",
    summary: "Como filtrar qualquer relatório por período e unidade e levar os dados para a planilha.",
    module: "relatorios",
    level: "essencial",
    requires: [{ route: "/reports" }],
    openRoute: "/reports",
    steps: [
      {
        title: "Comece pela visão geral",
        body: "Relatórios resume receita, unidades, lucro e margem do período e leva para Vendas, Categorias e produtos, Atributos mais vendidos, Lucratividade e Curva ABC.",
        shot: shot("relatorios-visao", "Visão geral dos relatórios"),
      },
      {
        title: "Filtre período e loja",
        body: "No topo de cada relatório: Período (Últimos 7, 30 ou 90 dias, Este mês, Mês passado ou Personalizado com datas e \"Aplicar\") e Loja (Toda a rede ou uma unidade). Trocar de aba mantém os filtros.",
      },
      {
        title: "Exporte",
        body: "\"Exportar CSV\" baixa exatamente o que está filtrado. Em Relatórios › Exportações há CSVs prontos de um clique: Catálogo completo, Vendas 30 dias, Lucratividade, Movimentações 90 dias, Fornecedores e compras e Folha de contagem.",
        shot: shot("exportacoes", "Tela de exportações"),
        tip: "Perfis sem acesso a custo veem \"—\" em margem e custo, na tela e no CSV.",
      },
    ],
    related: ["relatorio-de-vendas", "curva-abc", "lucratividade"],
    keywords: ["relatorio", "exportar", "csv", "excel", "periodo", "filtro"],
    updatedAt: UPDATED,
  },
  {
    slug: "relatorio-de-vendas",
    title: "Relatório de vendas e categorias",
    summary: "Receita por dia, ticket médio, formas de pagamento, receita por unidade e ranking de produtos.",
    module: "relatorios",
    level: "essencial",
    requires: [{ route: "/reports/sales" }, { route: "/reports/categories" }],
    openRoute: "/reports/sales",
    steps: [
      {
        title: "Vendas",
        body: "Receita total, número de vendas, ticket médio e margem; gráfico de receita por dia; blocos \"Por forma de pagamento\" e \"Receita por unidade\".",
        shot: shot("rel-vendas", "Relatório de vendas"),
      },
      {
        title: "Categorias e produtos",
        body: "Participação de cada categoria no faturamento e o top 20 produtos da rede. O CSV traz a lista completa.",
        shot: shot("rel-categorias", "Relatório de categorias e produtos"),
      },
      {
        title: "Atributos mais vendidos",
        body: "Em Atributos, escolha a categoria nos chips para ver quais cores, tamanhos ou especificações mais vendem — útil para decidir a grade da próxima compra.",
      },
    ],
    related: ["relatorios-e-exportacao", "curva-abc"],
    keywords: ["vendas", "faturamento", "ticket medio", "ranking", "mais vendidos"],
    updatedAt: UPDATED,
  },
  {
    slug: "curva-abc",
    title: "Curva ABC de estoque",
    summary: "Quais produtos fazem a receita e onde o dinheiro está parado — com recomendação por item.",
    module: "relatorios",
    level: "avancado",
    requires: [{ route: "/reports/abc" }],
    openRoute: "/reports/abc",
    steps: [
      {
        title: "Entenda as classes",
        body: "A: produtos que somam até 70% da receita do período. B: até 90%. C: o restante. O gráfico mostra a concentração e a tabela traz receita, valor em estoque, cobertura e giro de cada SKU.",
        shot: shot("rel-abc", "Curva ABC de estoque"),
      },
      {
        title: "Siga a recomendação",
        body: "Cada item recebe uma recomendação: Nunca faltar, Manter, Reduzir compra ou Liquidar.",
      },
    ],
    related: ["anomalias", "promocoes", "reposicao-e-pedido"],
    keywords: ["abc", "curva", "giro", "capital parado", "pareto"],
    updatedAt: UPDATED,
  },
  {
    slug: "lucratividade",
    title: "Lucratividade: compras × vendas",
    summary: "Custo, receita, lucro bruto e margem por mês e por produto.",
    module: "relatorios",
    level: "avancado",
    requires: [{ route: "/reports/profit" }],
    openRoute: "/reports/profit",
    steps: [
      {
        title: "Leia o relatório",
        body: "Em Relatórios › Lucratividade: custo das vendas, receita, lucro bruto e margem média; o gráfico de compras × vendas dos últimos 6 meses (não segue o filtro de período) e o lucro por produto.",
        shot: shot("rel-lucro", "Relatório de lucratividade"),
        tip: "Só Gestor Financeiro e Proprietário veem este relatório completo; o Gestor de Estoque consulta.",
      },
    ],
    related: ["relatorio-de-vendas", "reajuste-de-precos"],
    keywords: ["lucro", "margem", "custo", "lucratividade", "rentabilidade"],
    updatedAt: UPDATED,
  },
  {
    slug: "visao-da-rede",
    title: "Visão da rede: comparar lojas",
    summary: "Receita, estoque e margem de cada unidade, e o estoque desbalanceado entre lojas.",
    module: "relatorios",
    level: "avancado",
    requires: [{ route: "/network" }],
    openRoute: "/network",
    steps: [
      {
        title: "Compare as unidades",
        body: "Em Visão da rede, os indicadores somam a rede e \"Desempenho por unidade\" compara receita e estoque de cada loja.",
      },
      {
        title: "Resolva o desbalanceamento",
        body: "\"Estoque desbalanceado\" lista o mesmo SKU faltando em uma unidade e sobrando em outra. \"Transferir\" abre a transferência com origem, destino e metade da diferença já preenchidas.",
        tip: "Transferir costuma sair mais barato e mais rápido que comprar.",
      },
    ],
    related: ["transferir-entre-lojas", "unidades-e-lojas"],
    keywords: ["rede", "lojas", "comparar", "filiais", "desbalanceado"],
    updatedAt: UPDATED,
  },
];

export const FINANCEIRO: HelpArticle[] = [
  {
    slug: "assinatura-e-planos",
    title: "Plano, assinatura e faturas",
    summary: "Assinar, trocar de plano, mudar para anual, ver faturas e cancelar.",
    module: "financeiro",
    level: "essencial",
    requires: [{ route: "/settings/subscription", level: "edit" }],
    openRoute: "/settings/subscription",
    steps: [
      {
        title: "Veja seu plano",
        body: "Em Configurações › Plano e assinatura aparecem o plano atual, os planos disponíveis (mensal ou anual) e o histórico de faturas.",
        shot: shot("assinatura", "Tela de plano e assinatura"),
      },
      {
        title: "Assine, troque ou mude para anual",
        body: "\"Assinar mensal\" e \"Assinar anual\" abrem o pagamento seguro da Stripe. Depois de assinar, \"Gerenciar assinatura\" abre o portal para cartão e dados de cobrança; \"Trocar de plano\" e \"Mudar para anual\" mostram a economia antes de confirmar.",
        warn: "A troca de plano fica bloqueada enquanto houver pagamento em atraso.",
      },
      {
        title: "Faturas e cancelamento",
        body: "Cada fatura tem \"Detalhes\", com \"Abrir no Stripe\" e \"Baixar PDF\". Para cancelar, digite CANCELAR e conclua no portal da Stripe.",
      },
    ],
    faq: [
      { q: "O que acontece se o pagamento atrasar?", a: "Em atraso, o sistema continua funcionando e mostra o aviso \"Atualizar pagamento\". Se a cobrança ficar em aberto, só as telas de cobrança continuam acessíveis até regularizar." },
    ],
    related: ["comprar-creditos", "emissao-fiscal"],
    keywords: ["plano", "assinatura", "fatura", "cobranca", "cancelar", "stripe", "boleto", "cartao"],
    updatedAt: UPDATED,
  },
  {
    slug: "comprar-creditos",
    title: "Comprar créditos de IA",
    summary: "Onde os créditos foram gastos e como comprar um pacote extra.",
    module: "financeiro",
    level: "essencial",
    requires: [{ route: "/settings/credits", level: "edit" }],
    openRoute: "/settings/credits",
    steps: [
      {
        title: "Acompanhe o consumo",
        body: "Em Configurações › Créditos de IA estão a cota do plano no ciclo, os pacotes extras e \"Onde os créditos foram\".",
        shot: shot("creditos", "Tela de créditos de IA"),
      },
      {
        title: "Compre um pacote",
        body: "\"Comprar créditos\" abre os pacotes e o pagamento pela Stripe. Pacotes extras não expiram e só são usados depois da cota do plano.",
      },
    ],
    related: ["creditos-de-ia", "assinatura-e-planos"],
    keywords: ["creditos", "comprar", "pacote", "ia"],
    updatedAt: UPDATED,
  },
  {
    slug: "emissao-fiscal",
    title: "Emissão fiscal",
    summary: "Como informar a situação fiscal da loja no Stoqmate.",
    module: "financeiro",
    level: "avancado",
    requires: [{ route: "/settings/fiscal", level: "edit" }],
    openRoute: "/settings/fiscal",
    steps: [
      {
        title: "Escolha a sua situação",
        body: "Em Configurações › Fiscal, escolha entre as três opções (querer emitir NFC-e no balcão, já emitir por outro sistema ou resolver depois) e clique em \"Salvar\".",
        shot: shot("fiscal", "Tela de emissão fiscal"),
        warn: "A emissão de NFC-e pelo próprio Stoqmate ainda não está disponível — a opção entra em lista de espera. Por enquanto, o recibo do app não é documento fiscal.",
      },
    ],
    related: ["assinatura-e-planos", "recibo-e-historico"],
    keywords: ["fiscal", "nfce", "nota fiscal", "cupom fiscal", "sefaz"],
    updatedAt: UPDATED,
  },
];

export const ADMINISTRACAO: HelpArticle[] = [
  {
    slug: "dados-da-empresa",
    title: "Dados da empresa e controle de caixa",
    summary: "Nome, CNPJ e a chave que liga o controle de caixa por turno.",
    module: "administracao",
    level: "essencial",
    requires: [{ route: "/settings/store-data", level: "edit" }],
    openRoute: "/settings/store-data",
    steps: [
      {
        title: "Atualize os dados",
        body: "Em Configurações › Dados da empresa, edite Nome da loja e CNPJ e clique em \"Salvar alterações\".",
      },
      {
        title: "Ligue ou desligue o controle de caixa",
        body: "\"Controlar caixa por turno\" exige abertura, sangria e fechamento com contagem. Com ele desligado, vender em dinheiro não depende de caixa aberto.",
        shot: shot("empresa-dados", "Opção Controlar caixa por turno"),
        warn: "Não dá para desligar o controle com algum caixa aberto.",
      },
    ],
    related: ["caixa-abrir-fechar", "marca-e-logo"],
    keywords: ["empresa", "cnpj", "razao social", "caixa por turno"],
    updatedAt: UPDATED,
  },
  {
    slug: "marca-e-logo",
    title: "Logo e cor da marca",
    summary: "Personalize o app, o recibo e os relatórios com a identidade da loja.",
    module: "administracao",
    level: "essencial",
    requires: [{ route: "/settings/branding", level: "edit" }],
    openRoute: "/settings/branding",
    steps: [
      {
        title: "Troque logo e cor",
        body: "Em Configurações › Branding, envie o logo (PNG, JPG ou WEBP até 2 MB; \"Substituir\" ou \"Remover\"), escolha a cor pelos atalhos ou digite o código hex e confira a pré-visualização. Clique em \"Salvar alterações\".",
        shot: shot("marca", "Tela de branding com logo e cor"),
      },
    ],
    related: ["dados-da-empresa"],
    keywords: ["logo", "marca", "cor", "identidade visual", "branding"],
    updatedAt: UPDATED,
  },
  {
    slug: "auditoria",
    title: "Log de alterações (auditoria)",
    summary: "Quem fez o quê e quando: convites, unidades, ajustes, reajustes e configurações.",
    module: "administracao",
    level: "avancado",
    requires: [{ route: "/settings/audit", level: "full" }],
    openRoute: "/settings/audit",
    steps: [
      {
        title: "Consulte o log",
        body: "Em Configurações › Log de alterações, cada linha mostra Quando, Quem, Tipo e Ação. Ajustes de inventário, reajustes em lote, convites e mudanças de configuração ficam registrados.",
        shot: shot("auditoria", "Log de alterações"),
      },
    ],
    related: ["ajuste-de-inventario", "reajuste-de-precos", "cargos-e-permissoes"],
    keywords: ["auditoria", "log", "historico de alteracoes", "quem fez"],
    updatedAt: UPDATED,
  },
  {
    slug: "excluir-conta",
    title: "Excluir a conta da empresa",
    summary: "O que acontece e como confirmar a exclusão definitiva.",
    module: "administracao",
    level: "avancado",
    requires: [{ route: "/settings/store-data", level: "full" }, { route: "/settings/users", level: "full" }],
    openRoute: "/settings/store-data",
    steps: [
      {
        title: "Use a Zona de risco",
        body: "Em Configurações › Dados da empresa, \"Excluir conta\" fica na Zona de risco. Para confirmar, digite o nome da loja e clique em \"Excluir permanentemente\".",
        shot: shot("empresa-excluir", "Zona de risco com Excluir conta"),
        warn: "A assinatura é cancelada na hora, sua sessão é encerrada e a conta fica marcada para remoção (a remoção definitiva é feita pela equipe Stoqmate e não tem volta). Exporte antes o que quiser guardar em Relatórios › Exportações.",
      },
    ],
    related: ["relatorios-e-exportacao", "assinatura-e-planos"],
    keywords: ["excluir", "apagar conta", "encerrar", "cancelar conta"],
    updatedAt: UPDATED,
  },
];
