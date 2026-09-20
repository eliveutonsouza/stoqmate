"use client";

import { catById } from '@/lib/mock';
import { colorHex, isColorValue } from '@/lib/attr-colors';

// `category` (objeto real) tem prioridade sobre `cat` (id do mock) — mesma
// razão do CategoryBadge: id real é uuid, não existe em src/lib/mock.js.
export function ProductThumb({ cat, category, brand, attrs, size = 32 }) {
  const c = category || catById(cat);
  const accentValue = Object.values(attrs || {}).find(isColorValue);
  return (
    <div style={{
      width: size, height: size, borderRadius: 5,
      background: c.cssVar || c.color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'var(--font-mono)',
      fontSize: Math.max(10, Math.floor(size * 0.34)), fontWeight: 600,
      letterSpacing: '0.01em', border: '1px solid var(--line)',
      position: 'relative', overflow: 'hidden',
    }} title={`${c.name}${brand ? ' · ' + brand : ''}`}>
      {(c.code || c.name || '').substring(0, 2).toUpperCase()}
      {accentValue && (
        <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: colorHex(accentValue) }}></span>
      )}
    </div>
  );
}
