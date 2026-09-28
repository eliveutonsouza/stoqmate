import type { HelpArticle } from "../types";
import { shot } from "../shots";

const UPDATED = "2026-09-28";

export const CONFIGURACAO: HelpArticle[] = [
  {
    slug: "onboarding",
    title: "Configuração inicial da loja (onboarding)",
    summary: "Os 6 passos depois do cadastro: nome, logo, cor, categorias, emissão fiscal e revisão.",
    module: "configuracao",
    level: "essencial",
    requires: [{ route: "/settings/units", level: "full" }],
    video: { key: "onboarding", seconds: 54 },
    intro: "Logo depois de criar a conta, o Stoqmate abre um assistente curto. Nada aqui é definitivo: tudo pode ser revisto depois em Configurações.",
    steps: [
      {
        title: "1. Nome da loja",
        body: "Informe o nome que aparece no painel, no recibo e nos relatórios (mínimo de 3 letras). Depois dá para trocar em Configurações › Dados da empresa.",
        shot: shot("onboarding-1-nome", "Passo 1 do onboarding: nome da loja"),
      },
      {
        title: "2. Logo",
        body: "Envie PNG, JPG ou WEBP de até 2 MB — ou clique em \"Não tenho logo agora — usar as iniciais\".",
        shot: shot("onboarding-2-logo", "Passo 2 do onboarding: envio do logo"),
      },
      {
        title: "3. Cor principal",
        body: "Escolha a cor da marca. Ela pinta botões e destaques do app para toda a equipe.",
        shot: shot("onboarding-3-cor", "Passo 3 do onboarding: cor principal"),
      },
      {
        title: "4. O que você vende",
        body: "Marque as categorias do seu ramo: Calçados, Vestuário, Eletrônicos, Casa & Decoração, Alimentos & Bebidas e Papelaria. Cada uma já vem com atributos (ex.: Cor e Tamanho) e unidade de medida. Não achou o seu ramo? Pule e crie a categoria do zero depois.",
        shot: shot("onboarding-4-categorias", "Passo 4 do onboarding: escolha de categorias"),
        tip: "Os atributos definem o SKU. Escolher bem aqui evita retrabalho no cadastro.",
      },
      {
        title: "5. Emissão fiscal",
        body: "Diga se a loja já emite nota por outro sistema ou se quer resolver isso depois. Pode ser configurado mais tarde em Configurações › Fiscal.",
        shot: shot("onboarding-5-fiscal", "Passo 5 do onboarding: emissão fiscal"),
      },
      {
        title: "6. Revisão e conclusão",
        body: "Confira o resumo, use \"Editar\" para voltar a um passo e clique em \"Concluir e entrar\". A tela final confirma que o período de teste está ativo e sugere os próximos passos.",
        shot: shot("onboarding-6-revisao", "Passo 6 do onboarding: revisão"),
      },
      {
        title: "Pronto: siga os próximos passos",
        body: "Clique em \"Ir para o dashboard\" ou \"Revisar categorias\". O checklist de Primeiros passos acompanha o que ainda falta.",
        shot: shot("onboarding-7-pronto", "Tela de loja pronta ao concluir o onboarding"),
      },
    ],
    related: ["checklist-inicial", "categorias-e-atributos", "unidades-e-lojas"],
    keywords: ["comecar", "cadastro inicial", "configurar loja", "assistente"],
    updatedAt: UPDATED,
  },
  {
    slug: "checklist-inicial",
    title: "Checklist \"Vamos colocar sua loja de pé\"",
    summary: "Os 7 passos que deixam a loja pronta para operar, com o progresso de cada um.",
    module: "configuracao",
    level: "essencial",
    requires: [{ route: "/first-run" }, { route: "/settings/units", level: "full" }],
    openRoute: "/first-run",
    steps: [
      {
        title: "Abra o checklist",
        body: "Em Ajuda › Primeiros passos (ou em /first-run) ficam: Loja criada, Categorias escolhidas, Cadastrar os produtos, Cadastrar fornecedores, Criar os locais de estoque, Convidar a equipe e Abrir o caixa. Cada item leva para a tela certa.",
        shot: shot("checklist", "Checklist de primeiros passos com progresso"),
      },
      {
        title: "Comece pelo catálogo",
        body: "\"Cadastrar os produtos\" é o passo que destrava o resto: sem produto não há venda, entrada nem relatório. Se você já tem uma planilha, use a importação por CSV.",
      },
      {
        title: "Relatórios precisam de histórico",
        body: "Os relatórios só ficam úteis com pelo menos 7 dias de vendas. Até lá, os cards mostram um aviso de \"sem base\".",
      },
    ],
    related: ["importar-catalogo", "cadastrar-produto", "convidar-equipe"],
    keywords: ["primeiros passos", "checklist", "comecar"],
    updatedAt: UPDATED,
  },
  {
    slug: "unidades-e-lojas",
    title: "Lojas, CD e outras unidades da rede",
    summary: "Cadastre lojas, centro de distribuição, quiosques e estoques externos — e entenda o que conta no limite do plano.",
    module: "configuracao",
    level: "essencial",
    requires: [{ route: "/settings/units", level: "full" }],
    openRoute: "/settings/units",
    steps: [
      {
        title: "Veja as unidades da rede",
        body: "Configurações › Unidades da rede lista cada unidade com tipo, SKUs e itens em estoque.",
        shot: shot("unidades-lista", "Lista de unidades da rede"),
      },
      {
        title: "Adicione uma unidade",
        body: "Clique em \"Adicionar unidade\" e preencha Nome (mínimo 2 letras), Tipo (Loja, CD, Quiosque ou Estoque externo), CNPJ e Cidade/estado. Cada unidade tem saldo de estoque próprio.",
        shot: shot("unidades-nova", "Janela de adicionar unidade"),
        tip: "Só unidades do tipo Loja contam no limite de lojas do plano. CD, quiosque e estoque externo não contam.",
      },
      {
        title: "Troque a unidade ativa",
        body: "Com mais de uma unidade, o topo do menu lateral mostra a unidade ativa e permite trocar. Vendas, caixa e entradas acontecem nela.",
        shot: shot("tour-unidade", "Seletor de unidade ativa"),
      },
    ],
    related: ["transferir-entre-lojas", "tour-pelo-app", "assinatura-e-planos"],
    keywords: ["filial", "loja", "cd", "deposito", "unidade", "rede"],
    updatedAt: UPDATED,
  },
  {
    slug: "convidar-equipe",
    title: "Convidar a equipe e definir o perfil de cada um",
    summary: "Gere o link de convite, escolha o perfil de acesso e acompanhe quem já entrou.",
    module: "configuracao",
    level: "essencial",
    requires: [{ route: "/settings/users", level: "full" }],
    openRoute: "/settings/users",
    video: { key: "equipe", seconds: 38 },
    steps: [
      {
        title: "Abra Configurações › Usuários",
        body: "A lista mostra cada pessoa, o perfil, o status e o último acesso. O plano define quantos usuários cabem na conta (convites em aberto contam).",
        shot: shot("equipe-lista", "Lista da equipe com o botão Convidar usuário"),
      },
      {
        title: "Convide",
        body: "Clique em \"Convidar usuário\", informe Nome completo, Email e o Perfil de acesso (Vendedor, Gestor de Estoque ou Gestor Financeiro). O quadro ao lado explica o que o perfil escolhido pode fazer.",
        shot: shot("equipe-convidar", "Janela de convite com nome, email e perfil"),
      },
      {
        title: "Envie o link você mesmo",
        body: "O Stoqmate não dispara o email de convite: copie o link com \"Copiar link\" e mande por WhatsApp ou email. O link vale por 7 dias; depois disso, gere outro.",
        warn: "O perfil Proprietário não pode ser convidado — ele é de quem criou a conta.",
      },
      {
        title: "A pessoa aceita e cria a senha",
        body: "Ao abrir o link, a pessoa confirma o nome e cria uma senha (mínimo 8 caracteres). Ela entra direto no dashboard, já com o perfil definido.",
        shot: shot("convite-aceitar", "Tela de aceite do convite"),
      },
      {
        title: "Mude o perfil ou remova",
        body: "Na lista, troque o perfil na própria linha ou use \"Remover\". Convites pendentes podem ser cancelados. Você não consegue remover a si mesmo.",
      },
    ],
    related: ["cargos-e-permissoes", "pedir-acesso"],
    keywords: ["usuario", "funcionario", "convite", "equipe", "vendedor", "acesso"],
    updatedAt: UPDATED,
  },
  {
    slug: "cargos-e-permissoes",
    title: "Perfis de acesso: o que cada cargo vê e faz",
    summary: "Vendedor, Gestor de Estoque, Gestor Financeiro e Proprietário — a matriz completa e como simular.",
    module: "configuracao",
    level: "avancado",
    requires: [{ route: "/settings/roles", level: "full" }],
    openRoute: "/settings/roles",
    intro: "O Stoqmate tem quatro perfis fixos. Cada área do app tem um nível por perfil: Sem acesso, Só consulta, Pode editar ou Controle total.",
    steps: [
      {
        title: "Leia a matriz",
        body: "Configurações › Perfis e permissões mostra, por área, o nível de cada perfil. Resumo: Vendedor opera o balcão e consulta catálogo e estoque, sem ver custo nem margem. Gestor de Estoque compra, recebe, confere e ajusta. Gestor Financeiro vê custo, margem e lucratividade e cuida de assinatura e fiscal, sem mexer no estoque. Proprietário faz tudo e é o único que gerencia usuários e unidades.",
        shot: shot("cargos-matriz", "Matriz de permissões por área e perfil"),
      },
      {
        title: "Simule um perfil",
        body: "Em \"Simular um perfil\", escolha um perfil para ver quantas telas ele consegue abrir e quais ficam bloqueadas.",
        shot: shot("cargos-simular", "Simulador de perfil"),
      },
      {
        title: "Perfis personalizados",
        body: "Por enquanto valem os perfis fixos; \"Criar perfil\" aparece como \"Em breve\".",
      },
    ],
    faq: [
      { q: "O vendedor vê o preço de custo?", a: "Não. Custo, margem e lucratividade ficam com Gestor Financeiro e Proprietário (o Gestor de Estoque só consulta)." },
      { q: "Quem aprova desconto acima de 20%?", a: "Gestor Financeiro ou Proprietário, informando email e senha na hora da venda." },
    ],
    related: ["convidar-equipe", "pedir-acesso"],
    keywords: ["permissao", "perfil", "cargo", "matriz", "acesso"],
    updatedAt: UPDATED,
  },
];
