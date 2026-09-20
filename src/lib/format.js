import { catById } from '@/lib/mock';

export function brl(n) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// === Domain primitives (category-driven, not vertical-specific) ===

// Attribute values that name a colour get a swatch; everything else is plain text.

export const unitLabel = (cat, n) => {
  const c = catById(cat);
  return Math.abs(n) === 1 ? c.unit : c.unitPlural;
};
