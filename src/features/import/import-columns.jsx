"use client";


export const IMPORT_COLUMNS = [
  { src: 'codigo', sample: 'FONE-ANC-PT-128', target: 'sku', required: false },
  { src: 'descricao', sample: 'Fone Bluetooth ANC', target: 'name', required: true },
  { src: 'fabricante', sample: 'Foneclear', target: 'brand', required: true },
  { src: 'linha', sample: 'Eletrônicos', target: 'category', required: true },
  { src: 'cor_produto', sample: 'Preto', target: 'attr:cor', required: false },
  { src: 'memoria', sample: '128 GB', target: 'attr:capacidade', required: false },
  { src: 'custo', sample: '158,00', target: 'purchase', required: true },
  { src: 'preco_venda', sample: '299,00', target: 'sale', required: true },
  { src: 'qtd', sample: '42', target: 'stock', required: false },
  { src: 'ean', sample: '7891234560128', target: 'barcode', required: false },
  { src: 'obs_internas', sample: 'garantia 12m', target: 'ignore', required: false },
];
