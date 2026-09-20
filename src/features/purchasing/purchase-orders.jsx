"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { REPLENISH } from '@/features/purchasing/replenish';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';

export function PurchaseOrders() {
  const navigate = useNavigate();
  const [picked, setPicked] = React.useState(new Set([0, 1, 2, 3, 4]));
  const [filter, setFilter] = React.useState('suggest');

  const rows = filter === 'suggest' ? REPLENISH.filter(r => r.suggest > 0)
    : filter === 'critical' ? REPLENISH.filter(r => r.urgency === 'critical')
    : REPLENISH;

  const selectedRows = [...picked].map(i => REPLENISH[i]).filter(Boolean);
  const totalValue = selectedRows.reduce((s, r) => s + r.suggest * r.cost, 0);
  const bySupplier = selectedRows.reduce((acc, r) => {
    acc[r.supplier] = (acc[r.supplier] || 0) + r.suggest * r.cost;
    return acc;
  }, {});

  const open = [
    { ref: 'PED 412', supplier: 'TechDistrib', items: 96, value: 15168.00, sent: '16 set', eta: '24 set', status: 'sent' },
    { ref: 'PED 409', supplier: 'Malha & Cia', items: 240, value: 8640.00, sent: '11 set', eta: '26 set', status: 'confirmed' },
    { ref: 'PED 408', supplier: 'Grão Nobre', items: 48, value: 8544.00, sent: '09 set', eta: '14 set', status: 'late' },
  ];

  return (
    <StoreShell route="/purchase-orders" breadcrumb={['Compras']} navigate={navigate}>
      <PageHeader
        title="Reposição e compras"
        sub="Sugestão calculada por venda dos últimos 30 dias, estoque mínimo e prazo de cada fornecedor"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar sugestão</button>
            <button onClick={() => navigate('/purchase-orders/new')} className="btn btn-primary btn-sm">
              <I.Plus size={13} /> Gerar pedidos ({Object.keys(bySupplier).length})
            </button>
          </>
        )}
        tabs={[
          { id: 'suggest', label: `Sugeridos · ${REPLENISH.filter(r => r.suggest > 0).length}` },
          { id: 'critical', label: `Críticos · ${REPLENISH.filter(r => r.urgency === 'critical').length}` },
          { id: 'all', label: `Todos · ${REPLENISH.length}` },
        ]}
        activeTab={filter}
        onTab={setFilter}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'SKUs a repor', v: '7', s: '5 em estado crítico', tone: 'warning' },
            { l: 'Valor sugerido', v: 'R$ 43.104', s: 'a preço de compra' },
            { l: 'Pedidos em aberto', v: '3', s: '1 atrasado', tone: 'danger' },
            { l: 'Cobertura média', v: '14 dias', s: 'meta: 30 dias', tone: 'warning' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: m.tone === 'danger' ? 'var(--danger)' : m.tone === 'warning' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Sugestão de reposição</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Cobertura = dias de estoque no ritmo de venda atual. A sugestão cobre o prazo de entrega mais 30 dias.
              </p>
            </div>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{picked.size} selecionados · {brl(totalValue)}</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={picked.size === rows.length} onChange={() => setPicked(picked.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)))} />
                </th>
                <th>Produto</th><th>Categoria</th>
                <th className="num">Saldo</th><th className="num">Mín.</th><th className="num">Vendas 30d</th>
                <th style={{ width: '13%' }}>Cobertura</th>
                <th>Fornecedor</th><th className="num">Prazo</th>
                <th className="num">Sugerido</th><th className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.sku} style={{ background: picked.has(i) ? 'var(--accent-soft)' : undefined }}>
                  <td>
                    <input type="checkbox" checked={picked.has(i)} onChange={() => {
                      const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); setPicked(n);
                    }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ProductThumb cat={r.cat} attrs={r.attrs} size={26} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td><CategoryBadge cat={r.cat} /></td>
                  <td className="num">
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                      color: r.stock === 0 ? 'var(--danger)' : r.stock < r.min ? 'var(--warning)' : 'var(--fg)',
                    }}>{r.stock}</span>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.min}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.sold30}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                        <div style={{
                          width: `${Math.min((r.cover / 30) * 100, 100)}%`, height: '100%', borderRadius: 2,
                          background: r.cover < r.lead ? 'var(--danger)' : r.cover < 30 ? 'var(--warning)' : 'var(--success)',
                        }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 30, textAlign: 'right' }}>{r.cover}d</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{r.supplier}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.lead}d</td>
                  <td className="num">
                    {r.suggest > 0
                      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{r.suggest}</span>
                      : <span style={{ fontSize: 11, color: 'var(--success)' }}>suficiente</span>}
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.suggest ? brl(r.suggest * r.cost) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
              Os selecionados geram <strong>{Object.keys(bySupplier).length} pedidos</strong>, um por fornecedor.
            </span>
            <button onClick={() => navigate('/purchase-orders/new')} className="btn btn-primary btn-sm">Gerar pedidos</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Valor por fornecedor</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>Da seleção atual. Verifique o pedido mínimo de cada um.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(bySupplier).map(([sup, val], i) => (
                <div key={sup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12 }}>{sup}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{brl(val)}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                    <div style={{ width: `${(val / Math.max(...Object.values(bySupplier))) * 100}%`, height: '100%', background: i === 0 ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Pedidos em aberto</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Já considerados na sugestão acima.</p>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr><th>Pedido</th><th>Fornecedor</th><th className="num">Itens</th><th className="num">Valor</th><th>Previsão</th><th>Status</th></tr>
              </thead>
              <tbody>
                {open.map(o => (
                  <tr key={o.ref}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{o.ref}</td>
                    <td style={{ fontSize: 13 }}>{o.supplier}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.items}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(o.value)}</td>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: o.status === 'late' ? 'var(--danger)' : 'var(--fg-muted)' }}>{o.eta}</td>
                    <td>
                      {o.status === 'late' ? <span className="badge badge-danger"><I.Alert size={10} /> Atrasado</span>
                        : o.status === 'confirmed' ? <span className="badge badge-success"><span className="badge-dot"></span> Confirmado</span>
                        : <span className="badge badge-info">Enviado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /purchase-orders/new ===
