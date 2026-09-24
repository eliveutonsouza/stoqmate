"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { EmptyState } from '@/components/ui/empty-state';

export function NetworkDashboard({ revenue, margin, totalQty, ruptureCount, stores, imbalance }) {
  const navigate = useNavigate();
  const maxRev = Math.max(1, ...stores.map((u) => u.revenue));

  return (
    <StoreShell route="/network" breadcrumb={['Rede']} navigate={navigate}>
      <PageHeader
        title="Visão da rede"
        sub={`Últimos 30 dias · ${stores.length} unidade${stores.length === 1 ? '' : 's'} · consolidado e comparativo`}
        actions={(
          <button onClick={() => navigate('/stock/transfer')} className="btn btn-primary btn-sm"><I.Swap size={13} /> Transferir</button>
        )}
      />
      <Page gap={20}>
        <div className="g4 kpi-strip">
          {[
            { l: 'Receita da rede (30d)', v: brl(revenue) },
            { l: 'Itens em estoque', v: totalQty.toLocaleString('pt-BR') },
            { l: 'Margem consolidada', v: `${margin.toFixed(1)}%` },
            { l: 'SKUs em ruptura', v: `${ruptureCount}`, tone: ruptureCount > 0 ? 'down' : undefined },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'down' ? 'var(--warning)' : 'var(--fg)' }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Desempenho por unidade</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Receita dos últimos 30 dias e estoque atual.</p>
          </div>
          <table className="table">
            <thead>
              <tr><th>Unidade</th><th>Tipo</th><th style={{ width: '30%' }}>Receita (30d)</th><th className="num">SKUs</th><th className="num">Itens em estoque</th></tr>
            </thead>
            <tbody>
              {stores.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={u.name} />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </td>
                  <td><span className="badge">{u.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                        <div style={{ width: `${(u.revenue / maxRev) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 62, textAlign: 'right' }}>{brl(u.revenue)}</span>
                    </div>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.skuCount}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.qty.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Estoque desbalanceado</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Mesmo SKU com saldo bem diferente entre unidades. Transferir sai mais barato e mais rápido que comprar.
              </p>
            </div>
            <button onClick={() => navigate('/stock/transfer')} className="btn btn-primary btn-sm"><I.Swap size={12} /> Transferir</button>
          </div>
          {imbalance.length === 0 ? (
            <EmptyState icon={<I.Swap size={18} />} title="Nenhum desbalanceamento relevante" desc="O estoque está distribuído de forma equilibrada entre as unidades." />
          ) : (
            <table className="table">
              <thead><tr><th>Produto</th><th className="num">Menor saldo</th><th className="num">Maior saldo</th><th style={{ width: 100 }}></th></tr></thead>
              <tbody>
                {imbalance.map((r) => (
                  <tr key={r.productId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductThumb category={r.product?.category} brand={r.product?.brand} attrs={r.product?.attrs} size={26} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.product?.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{variantLabel(r.product?.attrs || {})}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <span style={{ display: 'inline-block', minWidth: 34, textAlign: 'center', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, background: 'var(--danger-soft)', color: 'var(--danger)' }}>{r.min.qty}</span>
                    </td>
                    <td className="num">
                      <span style={{ display: 'inline-block', minWidth: 34, textAlign: 'center', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, background: 'var(--info-soft)', color: 'var(--info)' }}>{r.max.qty}</span>
                    </td>
                    <td><button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm">Transferir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
