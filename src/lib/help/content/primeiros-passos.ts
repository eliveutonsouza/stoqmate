import type { HelpArticle } from "../types";
import { shot } from "../shots";

const UPDATED = "2026-09-28";

export const PRIMEIROS_PASSOS: HelpArticle[] = [
  {
    slug: "tour-pelo-app",
    title: "Tour pelo Stoqmate: onde fica cada coisa",
    summary: "O menu lateral, o dashboard, as ações rápidas, a troca de loja e o menu da sua conta — o mapa do app em 2 minutos.",
    module: "primeiros-passos",
    level: "essencial",
    requires: [{ route: "/dashboard" }],
    openRoute: "/dashboard",
    video: { key: "tour", seconds: 50 },
    intro: "Tudo no Stoqmate parte do menu lateral. O que aparece nele depende do seu perfil de acesso: se um item não aparece para você, é porque o seu perfil não usa aquela tela.",
    steps: [
      {
        title: "Use o menu lateral para navegar",
        body: "À esquerda ficam as áreas do app: Dashboard, Visão da rede, IA, Balcão, Catálogo, Estoque e Relatórios. Em Operação ficam Compras, Fornecedores, Promoções e Locais de estoque; em Conta, Configurações, Meu perfil, Notificações e Ajuda. Os números ao lado dos itens mostram pendências (pedidos abertos, notificações não lidas).",
        shot: shot("tour-menu", "Menu lateral do Stoqmate com as áreas do app"),
      },
      {
        title: "Leia o dashboard de cima para baixo",
        body: "O topo mostra receita dos últimos 30 dias, unidades vendidas, itens em estoque e giro. Logo abaixo, a receita por dia, a receita por categoria, o saldo de cada unidade da rede, os mais vendidos e os produtos abaixo do mínimo — cada um com botão para agir (\"Repor\", \"Detalhar\").",
        shot: shot("tour-kpis", "Indicadores do dashboard: receita, unidades vendidas, itens em estoque e giro"),
      },
      {
        title: "Comece tarefas pelas Ações rápidas",
        body: "O card Ações rápidas leva direto para Nova venda, Entrada de estoque, Transferir entre lojas, Cadastrar produto, Ajuste de inventário e Nova promoção. Só aparecem as ações que o seu perfil consegue concluir.",
        shot: shot("tour-acoes", "Card de ações rápidas com atalhos de teclado"),
        tip: "No dashboard, fora de um campo de texto, as teclas V, E, T, N, A e P abrem cada ação rápida.",
      },
      {
        title: "Troque a unidade ativa",
        body: "No topo do menu aparecem a empresa e a unidade em que você está trabalhando. Se a rede tiver mais de uma loja, clique ali para trocar. Vendas, entradas e o caixa usam sempre a unidade ativa.",
        shot: shot("tour-unidade", "Seletor da unidade ativa no topo do menu lateral"),
      },
      {
        title: "Acesse sua conta no rodapé do menu",
        body: "Clique no seu nome, no rodapé do menu, para abrir Meu perfil, Ajuda ou Sair. Seu perfil de acesso (Vendedor, Gestor de Estoque, Gestor Financeiro ou Proprietário) aparece logo abaixo do nome.",
        shot: shot("tour-conta", "Menu da conta no rodapé do menu lateral"),
      },
    ],
    faq: [
      { q: "Por que um colega vê itens de menu que eu não vejo?", a: "O menu mostra só o que o seu perfil alcança. Se precisar de uma tela, abra o endereço dela: o app mostra quem tem acesso e um botão \"Pedir acesso\"." },
      { q: "O dashboard mostra dados de qual loja?", a: "Os indicadores somam a rede inteira nos últimos 30 dias; o card \"Estoque na rede\" separa por unidade." },
    ],
    related: ["busca-e-atalhos", "notificacoes", "pedir-acesso"],
    keywords: ["menu", "navegar", "dashboard", "inicio", "unidade", "trocar loja"],
    updatedAt: UPDATED,
  },
  {
    slug: "busca-e-atalhos",
    title: "Busca rápida (Ctrl+K) e atalhos de teclado",
    summary: "Abra qualquer tela ou ação sem tirar a mão do teclado.",
    module: "primeiros-passos",
    level: "essencial",
    requires: [{ route: "/dashboard" }],
    openRoute: "/dashboard",
    steps: [
      {
        title: "Abra a paleta com Ctrl+K (⌘K no Mac)",
        body: "Em qualquer tela, aperte Ctrl+K ou clique em \"Buscar produtos, SKUs…\" no topo do menu. Digite parte do nome de uma tela ou ação — por exemplo \"transf\" — e aperte Enter. Use ↑ e ↓ para escolher e Esc para fechar.",
        shot: shot("busca-paleta", "Paleta de comandos filtrando por \"transf\""),
      },
      {
        title: "Use os atalhos do dashboard",
        body: "No dashboard, com o cursor fora de campos de texto: V = Nova venda, E = Entrada de estoque, T = Transferir entre lojas, N = Cadastrar produto, A = Ajuste de inventário, P = Nova promoção.",
      },
      {
        title: "Busque produtos no balcão com o leitor",
        body: "No PDV e nos formulários de estoque, o campo de produto aceita o leitor de código de barras: bipe e o item entra direto quando o código ou o SKU batem exatamente.",
      },
    ],
    faq: [
      { q: "A paleta não achou o produto. E agora?", a: "A paleta é para telas e ações. Para produtos, escolha \"Abrir busca completa\" ou use o campo de busca do Catálogo." },
    ],
    related: ["tour-pelo-app", "perguntar-a-ia", "consultar-produto"],
    keywords: ["atalho", "teclado", "ctrl k", "command", "paleta", "buscar"],
    updatedAt: UPDATED,
  },
  {
    slug: "notificacoes",
    title: "Notificações e avisos por email",
    summary: "Ruptura, estoque abaixo do mínimo, diferença no caixa e pedidos de acesso — onde ver e como receber por email.",
    module: "primeiros-passos",
    level: "essencial",
    requires: [{ route: "/notifications" }],
    openRoute: "/notifications",
    steps: [
      {
        title: "Veja os avisos na tela Notificações",
        body: "O sino no topo e o item Notificações do menu abrem a lista. Use as abas Todas, Não lidas, Ruptura e Alertas. Clicar em um aviso marca como lido e abre o que ele cita (o produto, o caixa ou a tela de usuários).",
        shot: shot("notificacoes-lista", "Lista de notificações com avisos de estoque"),
      },
      {
        title: "Marque tudo como lido",
        body: "O botão \"Marcar todas como lidas\" zera o contador sem apagar o histórico.",
      },
      {
        title: "Escolha o que também vai por email",
        body: "Em Configurações › Regras de aviso, marque a coluna Email nas regras que devem chegar por email: Ruptura, Abaixo do mínimo, Pedido de acesso e Diferença no caixa. Os emails vão para os proprietários da conta. Regras marcadas \"Em breve\" ainda não enviam.",
        shot: shot("notificacoes-regras", "Regras de aviso com colunas No painel e Email"),
      },
    ],
    related: ["tour-pelo-app", "caixa-abrir-fechar", "pedir-acesso"],
    keywords: ["aviso", "alerta", "sino", "email", "ruptura", "minimo"],
    updatedAt: UPDATED,
  },
  {
    slug: "meu-perfil-e-seguranca",
    title: "Meu perfil: dados, senha e verificação em duas etapas",
    summary: "Atualize nome, telefone e foto, troque a senha e ative o código do app autenticador.",
    module: "primeiros-passos",
    level: "essencial",
    requires: [{ route: "/profile" }],
    openRoute: "/profile",
    steps: [
      {
        title: "Atualize seus dados pessoais",
        body: "Em Meu perfil › Dados pessoais, edite Nome completo e Telefone e clique em \"Salvar alterações\". \"Trocar foto\" aceita PNG, JPG ou WEBP. O email não é editável por aqui — fale com o suporte para trocar.",
        shot: shot("perfil-dados", "Card de dados pessoais do perfil"),
      },
      {
        title: "Troque a senha",
        body: "Em Segurança, informe a Senha atual, a Nova senha (mínimo 8 caracteres) e repita em Confirmar nova senha. Clique em \"Atualizar senha\".",
        shot: shot("perfil-senha", "Formulário de troca de senha"),
        warn: "Se as duas senhas novas forem diferentes, o app avisa \"As senhas não coincidem.\" e não troca nada.",
      },
      {
        title: "Ative a verificação em duas etapas",
        body: "Em Verificação em duas etapas, clique em \"Ativar\", leia o QR code com um app autenticador (Google Authenticator, Microsoft Authenticator, 1Password…) ou digite a chave manual, informe o código de 6 dígitos e clique em \"Confirmar\". A partir daí o login pede o código.",
        shot: shot("perfil-2fa", "Seção de verificação em duas etapas"),
        tip: "Guarde a chave manual em local seguro: ela recupera o autenticador se você trocar de celular.",
      },
    ],
    related: ["tour-pelo-app"],
    keywords: ["senha", "2fa", "autenticador", "foto", "telefone", "seguranca"],
    updatedAt: UPDATED,
  },
  {
    slug: "pedir-acesso",
    title: "Não tenho acesso a uma tela. Como peço?",
    summary: "O que significa a tela \"Seu perfil não tem acesso\" e como o proprietário libera.",
    module: "primeiros-passos",
    level: "essencial",
    requires: [{ route: "/dashboard" }],
    steps: [
      {
        title: "Entenda o aviso",
        body: "Quando você abre uma tela fora do seu perfil, o app mostra \"Seu perfil não tem acesso a esta tela\", explica por quê e diz quais perfis alcançam aquela área.",
        shot: shot("acesso-negado", "Tela de acesso negado com o botão Pedir acesso"),
      },
      {
        title: "Clique em \"Pedir acesso\"",
        body: "O pedido chega como notificação para o proprietário, com o seu nome e a tela que você tentou abrir.",
      },
      {
        title: "O proprietário decide",
        body: "Perfis são fixos: para liberar, o proprietário muda o seu perfil em Configurações › Usuários. Não existe liberação de uma tela isolada.",
      },
    ],
    related: ["cargos-e-permissoes", "convidar-equipe"],
    keywords: ["permissao", "acesso negado", "bloqueado", "liberar"],
    updatedAt: UPDATED,
  },
];
