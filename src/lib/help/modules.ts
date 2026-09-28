import type { HelpModule } from "./types";

// Ordem = ordem da jornada: entrar, montar, vender, repor, analisar, governar.
export const HELP_MODULES: HelpModule[] = [
  { id: "primeiros-passos", title: "Primeiros passos", icon: "Home", desc: "Navegar, buscar, atalhos, notificações e o seu perfil." },
  { id: "configuracao", title: "Configuração da loja", icon: "Settings", desc: "Onboarding, unidades, equipe e permissões." },
  { id: "catalogo", title: "Catálogo", icon: "Box", desc: "Categorias, cadastro, importação, preços e etiquetas." },
  { id: "vendas", title: "Vendas e caixa", icon: "Credit", desc: "Balcão, venda completa, caixa, recibo e clientes." },
  { id: "estoque", title: "Estoque", icon: "Activity", desc: "Entrada, transferência, troca, devolução, ajuste e contagem." },
  { id: "compras", title: "Compras e fornecedores", icon: "Truck", desc: "Reposição sugerida, pedidos, conferência de nota e fornecedores." },
  { id: "promocoes", title: "Promoções", icon: "Tag", desc: "Criar, agendar e encerrar promoções." },
  { id: "ia", title: "Inteligência artificial", icon: "Sparkle", desc: "Créditos, anomalias, previsão, enriquecimento e perguntas." },
  { id: "relatorios", title: "Relatórios", icon: "Chart", desc: "Vendas, categorias, curva ABC, lucratividade e exportações." },
  { id: "financeiro", title: "Assinatura e fiscal", icon: "Shield", desc: "Plano, cobrança, créditos de IA e emissão fiscal." },
  { id: "administracao", title: "Administração", icon: "Users", desc: "Dados da empresa, marca, controle de caixa e auditoria." },
];
