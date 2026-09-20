"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { createPurchaseOrderAction } from '@/features/purchasing/actions';

export function PurchaseOrderNew({ stores, storeId, suppliers, supplierId, suggestions }) {
  const navigate = useNavigate();
  const supplier = suppliers.find((s) => s.id === supplierId);
  const initialLines = React.useMemo(
    () => suggestions.filter((r) => r.supplier_id === supplierId && r.suggest_qty > 0),
    [suggestions, supplierId],
  );
  const [lines, setLines] = React.useState(initialLines);
  const [qty, setQty] = React.useState(() => initialLines.map((l) => l.suggest_qty));
  const [notes, setNotes] = React.useState('');
  const [freight, setFreight] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const removeLine = (i) => { setLines((ls) => ls.filter((_, j) => j !== i)); setQty((q) => q.filter((_, j) => j !== i)); };

  const subtotal = lines.reduce((s, l, i) => s + (qty[i] || 0) * l.cost_price, 0);
  const total = subtotal + freight;
  const minOrder = supplier?.min_order_value || 0;
  const canSubmit = lines.length > 0 && subtotal >= minOrder && lines.every((_, i) => qty[i] > 0);

  const submit = () => {
    setError('');
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await createPurchaseOrderAction({
        storeId, supplierId,
        items: lines.map((l, i) => ({ productId: l.product_id, qty: qty[i] })),
        notes, freight,
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/purchase-orders');
    });
  };

  return (
    <StoreShell route="/purchase-orders/new" breadcrumb={['Compras', 'Novo pedido']} navigate={navigate}>
      <PageHeader
        title="Pedido de compra"
        sub={supplier ? `${supplier.name} · gerado a partir da sugestão de reposição` : 'Selecione um fornecedor'}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Fornecedor e entrega" cols={2}>
              <Field label="Fornecedor" required span={1}>
                <SelectInput value={supplierId} onChange={(v) => navigate(`/purchase-orders/new?store=${storeId}&supplier=${v}`)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Entregar em" required span={1}>
                <SelectInput value={storeId} onChange={(v) => navigate(`/purchase-orders/new?store=${v}&supplier=${supplierId}`)} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Prazo médio do fornecedor" span={1}>
                <TextInput value={supplier?.lead_time_days ? `${supplier.lead_time_days} dias` : '—'} disabled />
              </Field>
              <Field label="Frete estimado" span={1}>
                <TextInput mono prefix="R$" type="number" value={freight} onChange={(e) => setFreight(+e.target.value || 0)} />
              </Field>
              <Field label="Observações ao fornecedor" span={2}>
                <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: entregar em horário comercial, agendar com o CD por telefone." />
              </Field>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Itens do pedido</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Quantidades vieram da sugestão — ajuste se precisar.</p>
                </div>
              </div>
              {lines.length === 0 ? (
                <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
                  Nenhum item sugerido para este fornecedor nesta unidade.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Produto</th><th>Variação</th><th className="num">Saldo</th><th style={{ width: 100 }}>Quantidade</th><th className="num">Custo un.</th><th className="num">Subtotal</th><th style={{ width: 30 }}></th></tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={l.product_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb category={l.category} brand={l.brand} attrs={l.attrs} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td><AttrChip value={variantLabel(l.attrs || {})} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: l.stock < l.min_stock ? 'var(--warning)' : 'var(--fg-muted)' }}>{l.stock}</td>
                        <td>
                          <TextInput mono type="number" value={qty[i]} onChange={(e) => setQty((q) => q.map((v, j) => (j === i ? +e.target.value || 0 : v)))} style={{ height: 28 }} />
                        </td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(l.cost_price)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{brl((qty[i] || 0) * l.cost_price)}</td>
                        <td><button onClick={() => removeLine(i)} className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo do pedido</div>
              <SummaryRow label={`${lines.length} SKUs · ${qty.reduce((a, b) => a + (b || 0), 0)} itens`} value={brl(subtotal)} />
              <SummaryRow label="Frete estimado" value={brl(freight)} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Total do pedido" value={brl(total)} strong />
              </div>
              {minOrder > 0 && (
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                  <SummaryRow label="Pedido mínimo" value={brl(minOrder)} />
                  <SummaryRow
                    label={subtotal >= minOrder ? 'Atende o mínimo' : 'Falta para o mínimo'}
                    value={subtotal >= minOrder ? 'OK' : brl(minOrder - subtotal)}
                    tone={subtotal >= minOrder ? 'success' : 'danger'}
                  />
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
            )}

            <button onClick={submit} className="btn btn-primary btn-lg"
              disabled={!canSubmit || pending}
              style={{ justifyContent: 'center', width: '100%', opacity: canSubmit && !pending ? 1 : 0.45 }}>
              {pending ? 'Enviando…' : subtotal >= minOrder ? 'Enviar pedido' : 'Abaixo do pedido mínimo'}
            </button>
            <button onClick={() => navigate('/purchase-orders')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Truck size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Ao enviar, o pedido fica em aberto. Quando a mercadoria chegar, receba o pedido na lista de compras
                para lançar a entrada de estoque.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
