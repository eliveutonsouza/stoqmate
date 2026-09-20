"use client";

import * as React from 'react';
import { I } from '@/components/icons';
import { SEMANTIC_HITS } from '@/features/ai-flows/semantic-hits';

export function SemanticResults({ q, navigate }) {
  const [open, setOpen] = React.useState(true);
  if (!open) return null;
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ color: 'var(--accent-text)', display: 'flex' }}><I.Sparkle size={13} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', flex: 1 }}>Encontrados por significado</span>
        <span className="badge badge-success">sem custo de crédito</span>
        <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Ocultar</button>
      </div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', padding: '9px 0', lineHeight: 1.5 }}>
          Casados pelo que o produto é, não só pela palavra “{q}” no nome — inclui itens que a busca literal deixaria de fora.
        </div>
        {SEMANTIC_HITS.map((h, i) => (
          <div key={h.sku} onClick={() => navigate('/products/detail')} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderTop: '1px solid var(--line-soft)', cursor: 'pointer',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{h.why}</div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{h.stock} em estoque</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: 96 }}>
              <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${h.score * 100}%`, height: '100%', background: 'var(--accent)' }}></div>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>{h.score.toFixed(2)}</span>
            </div>
            <span style={{ color: 'var(--fg-faint)', display: 'flex' }}><I.ChevronRight size={14} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
