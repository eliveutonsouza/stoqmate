"use client";

import { MOCK } from '@/lib/mock';
import { I } from '@/components/icons';

export function StoreBalanceCard({ navigate }) {
  const maxSkus = Math.max(...MOCK.store.siblings.map(s => s.skus));
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Estoque na rede</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>4 unidades · 7.998 SKUs no total.</p>
        </div>
        <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm"><I.Swap size={12} /> Transferir</button>
      </div>
      <div>
        {MOCK.store.siblings.map((s, i) => (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            borderBottom: i < MOCK.store.siblings.length - 1 ? '1px solid var(--line-soft)' : 'none',
            background: s.current ? 'var(--accent-soft)' : 'transparent',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.name}
                {s.current && <span className="badge badge-accent">Você está aqui</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{s.city}</div>
            </div>
            <div style={{ width: 96 }}>
              <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                <div style={{ width: `${(s.skus / maxSkus) * 100}%`, height: '100%', background: s.current ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 2 }}></div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 42, textAlign: 'right' }}>
              {s.skus.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
