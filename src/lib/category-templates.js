// Modelos de categoria oferecidos no onboarding (passo 4). Cada um traz
// esquema de atributos, unidade e cor; ao concluir o onboarding viram
// categorias reais da empresa (fn_complete_onboarding). Não é dado de tenant.

export const CATEGORY_TEMPLATES = [
  {
    id: 'calcados', name: 'Calçados', icon: 'Box', color: '#B45309',
    cssVar: 'var(--cat-calcados)', cssInk: 'var(--cat-calcados-ink)',
    unit: 'par', unitPlural: 'pares', code: 'CAL',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul Marinho', 'Rosa', 'Verde'] },
      { key: 'numeracao', label: 'Numeração', type: 'size', values: ['36', '37', '38', '39', '40', '41', '42', '43'] },
    ],
  },
  {
    id: 'vestuario', name: 'Vestuário', icon: 'Shirt', color: '#7C3AED',
    cssVar: 'var(--cat-vestuario)', cssInk: 'var(--cat-vestuario-ink)',
    unit: 'peça', unitPlural: 'peças', code: 'VES',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 'Bege'] },
      { key: 'tamanho', label: 'Tamanho', type: 'size', values: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
    ],
  },
  {
    id: 'eletronicos', name: 'Eletrônicos', icon: 'Zap', color: '#1D4FD7',
    cssVar: 'var(--cat-eletronicos)', cssInk: 'var(--cat-eletronicos-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'ELE',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Branco', 'Cinza', 'Azul'] },
      { key: 'capacidade', label: 'Capacidade', type: 'spec', values: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
    ],
  },
  {
    id: 'casa', name: 'Casa & Decoração', icon: 'Home', color: '#0F766E',
    cssVar: 'var(--cat-casa)', cssInk: 'var(--cat-casa-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'CAS',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Branco', 'Bege', 'Cinza', 'Verde', 'Marrom'] },
      { key: 'material', label: 'Material', type: 'spec', values: ['Algodão', 'Cerâmica', 'Vidro', 'Madeira', 'Inox'] },
    ],
  },
  {
    id: 'alimentos', name: 'Alimentos & Bebidas', icon: 'Coffee', color: '#A16207',
    cssVar: 'var(--cat-alimentos)', cssInk: 'var(--cat-alimentos-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'ALI',
    attributes: [
      { key: 'sabor', label: 'Sabor', type: 'spec', values: ['Tradicional', 'Intenso', 'Descafeinado', 'Frutas Vermelhas'] },
      { key: 'peso', label: 'Peso', type: 'spec', values: ['250 g', '500 g', '1 kg', '5 kg'] },
    ],
  },
  {
    id: 'papelaria', name: 'Papelaria', icon: 'Book', color: '#BE185D',
    cssVar: 'var(--cat-papelaria)', cssInk: 'var(--cat-papelaria-ink)',
    unit: 'unidade', unitPlural: 'unidades', code: 'PAP',
    attributes: [
      { key: 'cor', label: 'Cor', type: 'color', values: ['Preto', 'Azul', 'Vermelho', 'Verde'] },
      { key: 'formato', label: 'Formato', type: 'spec', values: ['A4', 'A5', 'Ofício', 'Carta'] },
    ],
  },
];

export const templateById = (id) => CATEGORY_TEMPLATES.find((c) => c.id === id);
