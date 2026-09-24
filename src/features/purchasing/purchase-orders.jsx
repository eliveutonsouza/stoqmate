"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useRouter } from 'next/navigation';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Modal } from '@/components/ui/modal';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { receivePurchaseOrderAction } from '@/features/purchasing/actions';

export function PurchaseOrders({ stores, storeId, suggestions, openOrders }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [picked, setPicked] = React.useState(() => new Set(suggestions.map((r, i) => (r.suggest_qty > 0 ? i : null)).filter((i) => i !== null)));
  const [filter, setFilter] = React.useState('suggest');
  const [receiveOrder, setReceiveOrder] = React.useState(null);
  const [receiveQty, setReceiveQty] = React.useState({});
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const suggestCount = suggestions.filter((r) => r.suggest_qty > 0).length;
  const criticalCount = suggestions.filter((r) => r.suggest_qty > 0 && r.stock === 0).length;
  const rows = filter === 'suggest' ? suggestions.filter((r) => r.suggest_qty > 0)
    : filter === 'critical' ? suggestions.filter((r) => r.suggest_qty > 0 && r.stock === 0)
    : suggestions;

  const selectedRows = [...picked].map((i) => suggestions[i]).filter(Boolean);
  const totalValue = selectedRows.reduce((s, r) => s + r.suggest_qty * r.cost_price, 0);
  const bySupplier = selectedRows.reduce((acc, r) => {
    const key = r.supplier_name || 'Sem fornecedor';
    acc[key] = (acc[key] || 0) + r.suggest_qty * r.cost_price;
    return acc;
  }, {});
  const supplierIds = [...new Set(selectedRows.filter((r) => r.supplier_id).map((r) => r.supplier_id))];

  const openReceive = (order) => {
    setReceiveOrder(order);
    setReceiveQty(Object.fromEntries(order.purchase_order_items.map((it) => [it.id, it.qty_ordered - it.qty_received])));
    setError('');
  };

  const submitReceive = () => {
    setError('');
    startTransition(async () => {
      const result = await receivePurchaseOrderAction({
        orderId: receiveOrder.id,
        items: Object.entries(receiveQty).map(([orderItemId, qtyReceived]) => ({ orderItemId, qtyReceived: +qtyReceived || 0 })),
      });
      if (result?.error) { setError(result.error); return; }
      setReceiveOrder(null);
      router.refresh();
    });
  };

  return (
    <StoreShell route="/purchase-orders" breadcrumb={['Compras']} navigate={navigate}>
      <PageHeader
        title="Reposição e compras"
        sub="Sugestão calculada por venda dos últimos 30 dias, estoque mínimo e prazo de cada fornecedor"
        actions={(
          <>
            {stores.length > 1 && (
              <SelectInput value={storeId} onChange={(v) => navigate(`/purchase-orders?store=${v}`)} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            )}
            <button
              onClick={() => navigate(`/purchase-orders/new?store=${storeId}${supplierIds[0] ? `&supplier=${supplierIds[0]}` : ''}`)}
              disabled={supplierIds.length === 0}
              className="btn btn-primary btn-sm" style={{ opacity: supplierIds.length ? 1 : 0.45 }}
            >
              <I.Plus size={13} /> Gerar pedido ({supplierIds.length})
            </button>
          </>
        )}
        tabs={[
          { id: 'suggest', label: `Sugeridos · ${suggestCount}` },
          { id: 'critical', label: `Críticos · ${criticalCount}` },
          { id: 'all', label: `Todos · ${suggestions.length}` },
        ]}
        activeTab={filter}
        onTab={setFilter}
      />
      <Page>
        <div className="g3 kpi-strip">
          {[
            { l: 'SKUs a repor', v: `${suggestCount}`, s: `${criticalCount} sem estoque`, tone: criticalCount ? 'warning' : undefined },
            { l: 'Valor sugerido', v: brl(suggestions.filter((r) => r.suggest_qty > 0).reduce((s, r) => s + r.suggest_qty * r.cost_price, 0)), s: 'a preço de compra' },
            { l: 'Pedidos em aberto', v: `${openOrders.filter((o) => o.status === 'sent').length}`, s: 'aguardando recebimento' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: m.tone === 'warning' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>
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
          {rows.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum produto precisa de reposição agora.</div>
          ) : (
            <div className="table-scroll"><table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={picked.size === rows.length && rows.length > 0} onChange={() => setPicked(picked.size === rows.length ? new Set() : new Set(suggestions.map((_, i) => i).filter((i) => rows.includes(suggestions[i]))))} />
                  </th>
                  <th>Produto</th><th>Categoria</th>
                  <th className="num">Saldo</th><th className="num">Mín.</th><th className="num">Vendas 30d</th>
                  <th style={{ width: '13%' }}>Cobertura</th>
                  <th>Fornecedor</th><th className="num">Prazo</th>
                  <th className="num">Sugerido</th><th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const i = suggestions.indexOf(r);
                  return (
                    <tr key={r.product_id} style={{ background: picked.has(i) ? 'var(--accent-soft)' : undefined }}>
                      <td>
                        <input type="checkbox" checked={picked.has(i)} onChange={() => {
                          const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); setPicked(n);
                        }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb category={r.category} brand={r.brand} attrs={r.attrs} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.category ? <CategoryBadge category={r.category} /> : '—'}</td>
                      <td className="num">
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                          color: r.stock === 0 ? 'var(--danger)' : r.stock < r.min_stock ? 'var(--warning)' : 'var(--fg)',
                        }}>{r.stock}</span>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.min_stock}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.sold_30d}</td>
                      <td>
                        {r.cover_days === null ? (
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>sem venda</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                              <div style={{
                                width: `${Math.min((r.cover_days / 30) * 100, 100)}%`, height: '100%', borderRadius: 2,
                                background: r.cover_days < r.lead_time_days ? 'var(--danger)' : r.cover_days < 30 ? 'var(--warning)' : 'var(--success)',
                              }}></div>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 30, textAlign: 'right' }}>{r.cover_days}d</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{r.supplier_name || '—'}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.lead_time_days}d</td>
                      <td className="num">
                        {r.suggest_qty > 0
                          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{r.suggest_qty}</span>
                          : <span style={{ fontSize: 11, color: 'var(--success)' }}>suficiente</span>}
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.suggest_qty ? brl(r.suggest_qty * r.cost_price) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
          {rows.length > 0 && (
            <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
                Os selecionados geram <strong>{supplierIds.length} {supplierIds.length === 1 ? 'pedido' : 'pedidos'}</strong>, um por fornecedor.
              </span>
              <button
                onClick={() => navigate(`/purchase-orders/new?store=${storeId}${supplierIds[0] ? `&supplier=${supplierIds[0]}` : ''}`)}
                disabled={supplierIds.length === 0}
                className="btn btn-primary btn-sm" style={{ opacity: supplierIds.length ? 1 : 0.45 }}
              >Gerar pedido</button>
            </div>
          )}
        </div>

        <div className="split-2" style={{ '--a': '1fr', '--b': '1.3fr', alignItems: 'stretch' }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Valor por fornecedor</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>Da seleção atual. Verifique o pedido mínimo de cada um.</p>
            {Object.keys(bySupplier).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Nada selecionado.</div>
            ) : (
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
            )}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Pedidos</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Em aberto aguardam recebimento — a entrada de estoque acontece na hora de receber.</p>
            </div>
            {openOrders.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum pedido registrado ainda.</div>
            ) : (
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr><th>Fornecedor</th><th className="num">Itens</th><th className="num">Valor</th><th>Criado em</th><th>Status</th><th style={{ width: 90 }}></th></tr>
                </thead>
                <tbody>
                  {openOrders.map((o) => {
                    const value = o.purchase_order_items.reduce((s, it) => s + it.qty_ordered * it.unit_cost, 0) + o.freight;
                    return (
                      <tr key={o.id}>
                        <td style={{ fontSize: 13 }}>{o.supplier?.name}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.purchase_order_items.length}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(value)}</td>
                        <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          {o.status === 'received'
                            ? <span className="badge badge-success"><span className="badge-dot"></span> Recebido</span>
                            : <span className="badge badge-info">Enviado</span>}
                        </td>
                        <td>
                          {o.status === 'sent' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openReceive(o)} className="btn btn-outline btn-sm">Receber</button>
                              <button onClick={() => navigate(`/stock/receive/match?id=${o.id}`)} className="btn btn-ghost btn-sm">Conferir nota</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </Page>

      <Modal
        open={!!receiveOrder} onClose={() => setReceiveOrder(null)}
        title="Receber pedido" desc={receiveOrder ? `${receiveOrder.supplier?.name} · entrada de estoque em ${receiveOrder.store?.name}` : ''}
        width={560}
        footer={(
          <>
            <button onClick={() => setReceiveOrder(null)} className="btn btn-ghost">Cancelar</button>
            <button onClick={submitReceive} disabled={pending} className="btn btn-primary">{pending ? 'Recebendo…' : 'Confirmar recebimento'}</button>
          </>
        )}
      >
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}
        {receiveOrder?.purchase_order_items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <span style={{ flex: 1, fontSize: 13 }}>{it.product?.name} · pedido: {it.qty_ordered} un. · custo {brl(it.unit_cost)}</span>
            <TextInput mono type="number" value={receiveQty[it.id] ?? 0}
              onChange={(e) => setReceiveQty((q) => ({ ...q, [it.id]: +e.target.value || 0 }))}
              style={{ width: 90, height: 30 }} />
          </div>
        ))}
      </Modal>
    </StoreShell>
  );
}
