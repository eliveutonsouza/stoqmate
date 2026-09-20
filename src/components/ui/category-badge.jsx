"use client";

import { catById } from '@/lib/mock';
import { I } from '@/components/icons';

export function CategoryBadge({ cat, showIcon = true }) {
  const c = catById(cat);
  const Ico = I[c.icon] || I.Box;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 4,
      background: 'var(--bg-sunken)', border: '1px solid var(--line-soft)',
      fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', whiteSpace: 'nowrap',
    }}>
      {showIcon && <span style={{ color: c.cssInk, display: 'flex' }}><Ico size={11} /></span>}
      {c.name}
    </span>
  );
}

// Pluralised unit for a category: "3 pares", "1 peça", "12 unidades".
