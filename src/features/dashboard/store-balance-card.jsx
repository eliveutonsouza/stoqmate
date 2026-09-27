"use client";

import { I } from '@/components/icons';
import { useCan } from '@/hooks/use-can';

export function StoreBalanceCard({ navigate, storeBalances }) {
  const canGo = useCan();
  const maxSkus = Math.max(1, ...storeBalances.map((s) => s.skuCount));
  const totalSkus = storeBalances.reduce((s, u) => s + u.skuCount, 0);
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Estoque na rede</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
            {storeBalances.length} unidade{storeBalances.length === 1 ? '' : 's'} · {totalSkus.toLocaleString('pt-BR')} SKUs com saldo.
          </p>
        </div>
        {canGo('/stock/transfer') && (<button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm"><I.Swap size={12} /> Transferir</button>)}
      </div>
      <div>
        {storeBalances.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            borderBottom: i < storeBalances.length - 1 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{s.qty.toLocaleString('pt-BR')} unidades</div>
            </div>
            <div style={{ width: 96 }}>
              <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                <div style={{ width: `${(s.skuCount / maxSkus) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 42, textAlign: 'right' }}>
              {s.skuCount.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
