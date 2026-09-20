"use client";

import { I } from '@/components/icons';
import { MOCK } from '@/lib/mock';

export function LowStockCard({ navigate }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
            Estoque crítico
            <span className="badge badge-warning"><I.Alert size={10} /> 24 SKUs</span>
          </h3>
          <button onClick={() => navigate('/stock')} className="btn btn-ghost btn-sm">Ver estoque <I.ChevronRight size={11} /></button>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Itens abaixo do mínimo definido na categoria.</p>
      </div>
      <div style={{ padding: '4px 0' }}>
        {MOCK.lowStock.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px',
            borderBottom: i < MOCK.lowStock.length - 1 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 5,
              background: 'var(--warning-soft)', color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12,
            }}>{p.qty}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</div>
            </div>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm">Repor</button>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>+20 outros itens em alerta</span>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Ver lista completa →</a>
      </div>
    </div>
  );
}
