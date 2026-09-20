"use client";


export const QUEUE = [
  { id: 1, src: 'ocr', title: 'NF 8431 · TechDistrib · 6 itens', detail: 'Entrada de 96 unidades em Loja Centro, total R$ 15.168,00', conf: 96,
    why: ['Todos os 6 itens casaram com SKUs existentes pelo código de barras', 'Fornecedor reconhecido pelo CNPJ da nota', 'Soma dos itens confere com o total impresso'] },
  { id: 2, src: 'ocr', title: 'NF 2204 · Grão Nobre · 1 item novo', detail: 'Café em Grãos · Descafeinado · 500 g não existe no catálogo', conf: 71,
    why: ['5 de 6 itens casaram; este não tem correspondência', 'Sabor "Descafeinado" existe no esquema de Alimentos', 'Peso "500 g" existe no esquema'] },
  { id: 3, src: 'forecast', title: 'Comprar 84 un · Fone Bluetooth ANC Preto 128 GB', detail: 'Acima da média de 30 dias (72) por tendência de alta e Black Friday', conf: 88,
    why: ['Venda cresceu 34% em 3 meses consecutivos', 'Novembro historicamente vende 2,1× a média', 'Prazo do TechDistrib é 8 dias — pedido precisa sair até 04/11'] },
  { id: 4, src: 'anomaly', title: 'Estoque fantasma · Camiseta Algodão Pima Branco M', detail: 'Sistema diz 204 un, mas o padrão de venda indica ruptura na prateleira', conf: 82,
    why: ['Vendia 11/dia e caiu para 0,4/dia em 6 dias, sem promoção concorrente', 'Mesma variação segue vendendo em Shopping Norte', 'Última conferência do local C-01 foi há 94 dias'] },
  { id: 5, src: 'anomaly', title: 'Padrão de perda · local A-05', detail: '4 ajustes negativos no mesmo local em 30 dias, sempre no turno da tarde', conf: 77,
    why: ['A-05 concentra 68% dos ajustes negativos da loja', 'Todos entre 14h e 18h', 'Itens de alto valor e pequeno volume'] },
  { id: 6, src: 'classify', title: 'Classificar 14 SKUs importados sem categoria', detail: 'Vindos de catalogo-bonsucesso.xlsx em 16/09', conf: 91,
    why: ['Nomes contêm termos que mapeiam ao esquema existente', '12 dos 14 têm marca já cadastrada', '2 exigem atributo novo em Casa & Decoração'] },
  { id: 7, src: 'price', title: 'Reduzir Moletom Flanelado Cinza G para R$ 149,00', detail: 'Giro de 0,3×/ano com 216 dias de cobertura · classe C', conf: 74,
    why: ['Preço atual 32% acima da média da categoria', 'Elasticidade do seu histórico sugere +180% de volume a R$ 149', 'Margem cai de 44% para 29%, ainda acima do piso'] },
  { id: 8, src: 'enrich', title: 'Completar atributos de 38 SKUs', detail: 'Cor ou material em branco após a importação', conf: 85,
    why: ['Inferido do nome do produto e da descrição do fornecedor', '38 de 41 com confiança acima de 70%', '3 SKUs ficaram sem sugestão e seguem em branco'] },
];
