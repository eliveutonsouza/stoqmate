import type { HelpArticle } from "../types";
import { shot } from "../shots";

const UPDATED = "2026-09-28";

export const COMPRAS: HelpArticle[] = [
  {
    slug: "reposicao-e-pedido",
    title: "Reposição sugerida e pedido de compra",
    summary: "Veja o que repor com base nas vendas, gere um pedido por fornecedor e receba a mercadoria.",
    module: "compras",
    level: "essencial",
    requires: [{ route: "/purchase-orders" }, { route: "/purchase-orders/new", level: "edit" }],
    openRoute: "/purchase-orders",
    video: { key: "reposicao", seconds: 33 },
    steps: [
      {
        title: "Veja a sugestão de reposição",
        body: "Em Compras, as abas Sugeridos, Críticos e Todos mostram cada SKU com saldo, mínimo, vendas em 30 dias, cobertura e a quantidade sugerida. A conta considera o ritmo de venda, o estoque mínimo e o prazo de entrega do fornecedor.",
        shot: shot("reposicao-sugeridos", "Tela de reposição e compras"),
      },
      {
        title: "Gere o pedido",
        body: "Marque os itens e clique em \"Gerar pedido (n)\". O app monta um pedido por fornecedor; itens sem fornecedor ficam de fora.",
        shot: shot("reposicao-gerar", "Botão Gerar pedido com itens selecionados"),
      },
      {
        title: "Revise e registre",
        body: "No Pedido de compra, confira Fornecedor, Entregar em, Frete estimado, Observações e as quantidades. O pedido mínimo do fornecedor é respeitado (\"Abaixo do pedido mínimo\" bloqueia). Clique em \"Registrar pedido\".",
        shot: shot("pedido-form", "Formulário do pedido de compra"),
        warn: "O Stoqmate não envia o pedido ao fornecedor. Mande você mesmo, pelo canal de costume.",
      },
      {
        title: "Receba quando chegar",
        body: "Na lista de pedidos, \"Receber\" pede a quantidade recebida de cada item e, ao confirmar, dá entrada no estoque. Se a nota tiver diferença de preço ou quantidade, use \"Conferir nota\".",
      },
    ],
    related: ["conferencia-da-nota", "fornecedores", "previsao-de-demanda", "entrada-de-estoque"],
    keywords: ["compra", "pedido", "reposicao", "repor", "fornecedor", "sugestao"],
    updatedAt: UPDATED,
  },
  {
    slug: "conferencia-da-nota",
    title: "Conferência da nota contra o pedido",
    summary: "Compare pedido, nota e o que chegou: conteste ou aceite cada divergência antes de dar entrada.",
    module: "compras",
    level: "avancado",
    requires: [{ route: "/stock/receive/match", level: "edit" }],
    steps: [
      {
        title: "Abra a conferência",
        body: "Em Compras, no pedido com status Enviado, clique em \"Conferir nota\". Para cada item, informe o que a nota cobra e o que chegou de fato.",
        shot: shot("conferencia-nota", "Conferência item a item da nota"),
      },
      {
        title: "Decida cada divergência",
        body: "Cada linha é marcada como Confere, Faltou, A mais ou Preço acima. Em toda divergência, escolha \"Contestar\" (entra pelo preço do pedido e gera pendência com o fornecedor) ou \"Aceitar\" (o preço da nota vira o novo custo).",
      },
      {
        title: "Dê entrada",
        body: "Com tudo decidido, \"Dar entrada\" soma o estoque com os custos certos.",
      },
    ],
    related: ["reposicao-e-pedido", "entrada-de-estoque", "fornecedores"],
    keywords: ["nota", "conferencia", "divergencia", "preco acima", "faltou"],
    updatedAt: UPDATED,
  },
  {
    slug: "fornecedores",
    title: "Cadastro de fornecedores",
    summary: "Contato, prazo, pedido mínimo, condição de pagamento e o que cada fornecedor atende.",
    module: "compras",
    level: "essencial",
    requires: [{ route: "/suppliers" }],
    openRoute: "/suppliers",
    steps: [
      {
        title: "Veja e filtre",
        body: "Em Fornecedores, busque e filtre por Categoria e Prazo. \"Exportar CSV\" baixa a lista.",
        shot: shot("fornecedores-lista", "Lista de fornecedores"),
      },
      {
        title: "Cadastre",
        body: "\"Cadastrar fornecedor\" pede Nome (mínimo 2 letras). Complete CNPJ, Endereço, Telefone, WhatsApp, Email de pedidos, Representante, Categorias atendidas, Marcas, Prazo médio de entrega, Pedido mínimo e Condição de pagamento (À vista, 28, 30/60, 30/60/90 ou Boleto 45 dias).",
        shot: shot("fornecedor-form", "Formulário de cadastro de fornecedor"),
        tip: "Prazo e pedido mínimo alimentam a reposição sugerida. Vale preencher.",
      },
    ],
    related: ["reposicao-e-pedido", "conferencia-da-nota"],
    keywords: ["fornecedor", "distribuidor", "prazo", "pedido minimo"],
    updatedAt: UPDATED,
  },
];

export const PROMOCOES: HelpArticle[] = [
  {
    slug: "promocoes",
    title: "Criar, agendar e encerrar promoções",
    summary: "Preço promocional por produto, categoria ou loja inteira, por período ou até acabar o estoque.",
    module: "promocoes",
    level: "essencial",
    requires: [{ route: "/promotions" }, { route: "/promotions/new", level: "edit" }],
    openRoute: "/promotions",
    steps: [
      {
        title: "Veja as promoções",
        body: "Em Promoções, as abas Todas, Ativas, Agendadas e Encerradas mostram vigência, preço de e por e desconto.",
        shot: shot("promocoes-lista", "Lista de promoções"),
      },
      {
        title: "Crie uma promoção",
        body: "\"Criar promoção\" pede Nome, Abrangência (Um produto, Uma categoria inteira ou Toda a loja), Vigência (Por período, com início e fim, ou Até acabar o estoque) e o Preço promocional, que precisa ser menor que o original. Os atalhos −5% a −40% calculam o preço.",
        shot: shot("promocao-nova", "Formulário de nova promoção"),
        warn: "O app avisa quando a margem na promoção fica abaixo de 15%.",
      },
      {
        title: "Encerre ou reative",
        body: "Na lista, \"Encerrar\" termina na hora e \"Reativar\" volta a valer. Promoções que acabaram pela data só mostram Detalhes. Uma promoção criada não é editável: encerre e crie outra.",
      },
    ],
    related: ["reajuste-de-precos", "venda-completa"],
    keywords: ["promocao", "oferta", "desconto", "liquidacao", "preco promocional"],
    updatedAt: UPDATED,
  },
];

export const IA: HelpArticle[] = [
  {
    slug: "creditos-de-ia",
    title: "Como funcionam os créditos de IA",
    summary: "O que cada recurso de IA custa, onde ver o saldo e o que acontece quando acaba.",
    module: "ia",
    level: "essencial",
    requires: [{ route: "/ai" }],
    openRoute: "/ai",
    intro: "A IA propõe e você confirma: nada entra no estoque ou no catálogo sem aprovação. Cada operação de IA consome créditos, que são devolvidos se a operação falhar.",
    steps: [
      {
        title: "Veja o saldo e o uso",
        body: "Em IA › Central de IA estão a cota do plano no ciclo, os créditos extras e o \"Uso por recurso neste ciclo\".",
        shot: shot("ia-hub", "Central de IA com saldo e uso"),
      },
      {
        title: "Custos por operação",
        body: "Perguntar à IA: 1 crédito · Classificar no cadastro: 1 · Enriquecimento: 1 por rodada · Previsão de demanda: 2 · Leitura de nota: 5. A detecção de anomalias não usa créditos (é matemática, não IA).",
      },
      {
        title: "Quando os créditos acabam",
        body: "A cota do plano renova a cada ciclo. Pacotes extras não expiram e só são usados depois da cota. Só Proprietário e Gestor Financeiro compram créditos.",
      },
    ],
    related: ["comprar-creditos", "anomalias", "previsao-de-demanda"],
    keywords: ["ia", "creditos", "inteligencia artificial", "custo", "saldo"],
    updatedAt: UPDATED,
  },
  {
    slug: "fila-de-revisao",
    title: "Fila de revisão da IA",
    summary: "Onde ficam as sugestões esperando sua decisão.",
    module: "ia",
    level: "essencial",
    requires: [{ route: "/ai/queue" }],
    openRoute: "/ai/queue",
    steps: [
      {
        title: "Confira as pendências",
        body: "Em IA › Fila de revisão, os contadores mostram Atributos faltando, Sugestão de reposição e Anomalias de estoque. Cada card leva para a tela onde você decide.",
        shot: shot("ia-fila", "Fila de revisão da IA"),
      },
    ],
    related: ["enriquecimento-de-catalogo", "reposicao-e-pedido", "anomalias"],
    keywords: ["fila", "revisao", "pendencias", "ia"],
    updatedAt: UPDATED,
  },
  {
    slug: "anomalias",
    title: "Detecção de anomalias: ruptura e estoque parado",
    summary: "Produtos que zeraram e vendiam bem, e produtos parados há 90 dias — sem gastar créditos.",
    module: "ia",
    level: "avancado",
    requires: [{ route: "/ai/anomalies" }],
    openRoute: "/ai/anomalies",
    steps: [
      {
        title: "Leia os achados",
        body: "Em IA › Anomalias aparecem: Ruptura (sem saldo, mas com venda recente), com o botão \"Repor agora\", e Estoque parado (sem venda em 90 dias), com \"Simular preço\". Os números são cálculo direto sobre vendas e saldos — não consomem créditos.",
        shot: shot("ia-anomalias", "Tela de detecção de anomalias"),
      },
      {
        title: "Aja ou ignore",
        body: "\"Ignorar\" só esconde o item até a página recarregar. Para resolver de verdade, reponha, transfira ou ajuste o preço.",
      },
    ],
    related: ["reposicao-e-pedido", "reajuste-de-precos", "ajuste-de-inventario"],
    keywords: ["anomalia", "ruptura", "parado", "encalhado", "perda"],
    updatedAt: UPDATED,
  },
  {
    slug: "previsao-de-demanda",
    title: "Previsão de demanda",
    summary: "A IA ajusta a sugestão de compra pela sazonalidade e tendência; você aceita por SKU.",
    module: "ia",
    level: "avancado",
    requires: [{ route: "/ai/forecast" }],
    openRoute: "/ai/forecast",
    steps: [
      {
        title: "Calcule a previsão",
        body: "Em IA › Previsão de demanda, \"Calcular previsão\" (2 créditos) compara a sugestão padrão (média de 30 dias) com a projeção da IA.",
        shot: shot("ia-previsao", "Tela de previsão de demanda"),
      },
      {
        title: "Aceite e abra a reposição",
        body: "Aceite ou recuse por SKU e clique em \"Aplicar N e abrir reposição\". O pedido abre preenchido — um fornecedor por vez.",
      },
    ],
    related: ["reposicao-e-pedido", "creditos-de-ia"],
    keywords: ["previsao", "demanda", "sazonalidade", "projecao"],
    updatedAt: UPDATED,
  },
  {
    slug: "enriquecimento-de-catalogo",
    title: "Enriquecimento de catálogo",
    summary: "Complete atributos em branco em lote, com a IA escolhendo só entre valores que já existem.",
    module: "ia",
    level: "avancado",
    requires: [{ route: "/ai/enrich" }],
    openRoute: "/ai/enrich",
    steps: [
      {
        title: "Selecione os SKUs com lacuna",
        body: "Em IA › Enriquecimento, a lista mostra produtos com atributo em branco (comum depois do cadastro rápido pelo celular). Selecione e clique em \"Completar N SKUs\" (1 crédito por rodada).",
        shot: shot("ia-enriquecimento", "Enriquecimento de catálogo"),
      },
      {
        title: "Revise e aplique",
        body: "A IA só escolhe valores já cadastrados na categoria. Aceite ou recuse cada sugestão e clique em \"Aplicar aos aceitos\".",
      },
    ],
    related: ["cadastro-pelo-celular", "categorias-e-atributos"],
    keywords: ["enriquecer", "atributos", "completar", "lacuna"],
    updatedAt: UPDATED,
  },
  {
    slug: "perguntar-a-ia",
    title: "Busca geral e perguntas em português",
    summary: "Procure produtos, movimentações e fornecedores de uma vez — ou pergunte \"quais fones estão abaixo do mínimo?\".",
    module: "ia",
    level: "essencial",
    requires: [{ route: "/search" }, { route: "/ai" }],
    openRoute: "/search",
    steps: [
      {
        title: "Busque em tudo",
        body: "Na tela Busca, a partir de 2 letras aparecem produtos, movimentações, fornecedores, promoções e locais de toda a rede.",
        shot: shot("busca-ia", "Busca geral com resultados agrupados"),
      },
      {
        title: "Pergunte",
        body: "Digite uma pergunta e clique em \"Perguntar\" (ou Enter), por 1 crédito. A resposta mostra o filtro aplicado, a confiança e uma tabela com \"Abrir\". Os números são calculados pelo sistema, não inventados pelo modelo.",
      },
    ],
    related: ["busca-e-atalhos", "creditos-de-ia"],
    keywords: ["busca", "pergunta", "ia", "procurar", "linguagem natural"],
    updatedAt: UPDATED,
  },
];
