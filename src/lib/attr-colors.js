
export const ATTR_COLORS = {
  'Preto': '#1a1a1a', 'Branco': '#f4f4f4', 'Cinza': '#8a8a8a',
  'Azul Marinho': '#1B2D5E', 'Azul': '#1D4FD7', 'Rosa': '#B4386B',
  'Verde': '#1F6B41', 'Vermelho': '#B02525', 'Bege': '#C6B191',
  'Marrom': '#6B4226', 'Amarelo': '#A87A08',
};

export const colorHex = (name) => ATTR_COLORS[name] || 'var(--fg-faint)';

export const isColorValue = (v) => Object.prototype.hasOwnProperty.call(ATTR_COLORS, v);

export const variantLabel = (attrs) => Object.values(attrs || {}).filter(v => v && v !== '—').join(' · ');

// Thumbnail keyed by CATEGORY, so a new category never lands on an unmapped fallback.
