"use client";

import { catById } from '@/lib/mock';
import { I } from '@/components/icons';

// `category` (objeto real, vindo do Supabase) tem prioridade sobre `cat`
// (id do mock, `src/lib/mock.js`) — as telas ainda não "backendizadas"
// continuam passando só o id; as que já leem categorias reais passam o
// objeto inteiro, porque o id real é um uuid que não existe no mock.
export function CategoryBadge({ cat, category, showIcon = true }) {
  const c = category || catById(cat);
  const Ico = I[c.icon] || I.Box;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 4,
      background: 'var(--bg-sunken)', border: '1px solid var(--line-soft)',
      fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', whiteSpace: 'nowrap',
    }}>
      {showIcon && <span style={{ color: c.cssInk || c.color, display: 'flex' }}><Ico size={11} /></span>}
      {c.name}
    </span>
  );
}

// Pluralised unit for a category: "3 pares", "1 peça", "12 unidades".
