"use client";

import { colorHex, isColorValue } from '@/lib/attr-colors';

export function AttrChip({ value }) {
  // The em-dash encodes data ("this attribute is empty"), so it gets content ink,
  // not the dimmest muted ink — same rule as the plan comparison table.
  if (!value || value === '—') return <span style={{ fontSize: 12, color: 'var(--fg-muted)' }} title="Sem variação">—</span>;
  if (!isColorValue(value)) return <span style={{ fontSize: 12 }}>{value}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: colorHex(value), border: '1px solid var(--line-strong)' }}></span>
      <span style={{ fontSize: 12 }}>{value}</span>
    </span>
  );
}

// Renders an attribute map as "Preto · 41" regardless of which keys the category uses.
