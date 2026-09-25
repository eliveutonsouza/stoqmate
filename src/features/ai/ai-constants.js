export const AI_FEATURES = [
  { id: 'ocr', name: 'OCR de nota fiscal', icon: 'Truck', on: true, route: '/stock/entry/ocr',
    what: 'Foto ou PDF da nota vira entrada de estoque, com os itens já casados aos seus SKUs.',
    where: 'Entrada de estoque', saves: '~6 min por nota' },
  { id: 'classify', name: 'Classificação no cadastro', icon: 'Layers', on: true, route: '/products/new',
    what: 'A partir do nome do produto, propõe categoria, atributos, valores e unidade de medida.',
    where: 'Cadastrar produto', saves: '~40 s por SKU' },
  { id: 'forecast', name: 'Previsão de demanda', icon: 'Chart', on: true, route: '/ai/forecast',
    what: 'Sugestão de compra com sazonalidade e tendência — não só média de 30 dias.',
    where: 'Reposição e compras', saves: 'menos ruptura e menos capital parado' },
  { id: 'anomaly', name: 'Detecção de anomalia', icon: 'Alert', on: true, route: '/ai/anomalies',
    what: 'Aponta ruptura com venda recente e estoque parado sem giro há 90 dias.',
    where: 'Estoque e notificações', saves: 'acha o que ninguém procurou' },
  { id: 'ask', name: 'Pergunta em linguagem natural', icon: 'Search', on: true, route: '/search',
    what: 'Pergunta em português sobre o seu estoque, respondida com tabela e gráfico.',
    where: 'Busca global', saves: 'relatório que você não precisou pedir' },
  { id: 'enrich', name: 'Enriquecimento de catálogo', icon: 'Sparkle', on: false, route: '/ai/enrich',
    what: 'Completa atributos em branco e escreve descrições para SKUs importados incompletos.',
    where: 'Catálogo', saves: 'catálogo importado fica utilizável' },
];

// === Real model call, JSON-shaped ===
// Every feature asks for strict JSON so the result can drive a review queue
// instead of being pasted as prose the user has to interpret.
