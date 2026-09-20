"use client";


export const TARGET_OPTIONS = [
  { value: 'ignore', label: '— Não importar —' },
  { value: 'sku', label: 'SKU (usar o código do arquivo)' },
  { value: 'name', label: 'Nome do produto' },
  { value: 'brand', label: 'Marca' },
  { value: 'category', label: 'Categoria' },
  { value: 'attr:cor', label: 'Atributo · Cor' },
  { value: 'attr:tamanho', label: 'Atributo · Tamanho' },
  { value: 'attr:capacidade', label: 'Atributo · Capacidade' },
  { value: 'attr:material', label: 'Atributo · Material' },
  { value: 'purchase', label: 'Preço de compra' },
  { value: 'sale', label: 'Preço de venda' },
  { value: 'stock', label: 'Saldo inicial' },
  { value: 'barcode', label: 'Código de barras' },
  { value: 'location', label: 'Local de estoque' },
  { value: 'supplier', label: 'Fornecedor' },
];
