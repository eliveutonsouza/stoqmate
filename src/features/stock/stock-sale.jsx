"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { ProductThumb } from '@/components/ui/product-thumb';
import { ProductPicker } from '@/components/ui/product-picker';
import { brl } from '@/lib/format';
import { EmptyState } from '@/components/ui/empty-state';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';
import { Modal } from '@/components/ui/modal';
import { confirmSaleAction } from '@/features/pos/actions';

const PAYMENTS = [
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'PIX', value: 'pix' },
  { label: 'Débito', value: 'debito' },
  { label: 'Cartão de crédito', value: 'credito' },
  { label: 'Crediário', value: 'crediario' },
  { label: 'Dividido', value: 'dividido' },
];

export function StockSale({ stores, cashSessionByStore }) {
  const navigate = useNavigate();
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? '');
  const [cart, setCart] = React.useState([]);
  const [orderOff, setOrderOff] = React.useState({ mode: 'pct', value: 0 });
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [payment, setPayment] = React.useState('credito');
  const [installments, setInstallments] = React.useState('1×');
  const [received, setReceived] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const stockFor = (p) => p.stock_balances?.find((b) => b.store_id === storeId)?.qty ?? 0;

  const setLine = (i, patch) => setCart(c => c.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setCart(c => c.filter((_, j) => j !== i));
  const addItem = (p) => setCart(c => {
    const at = c.findIndex(l => l.id === p.id);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { ...p, qty: 1, off: 0 }];
  });

  const lineNet = (l) => l.qty * l.sale_price * (1 - l.off / 100);
  const gross = cart.reduce((s, l) => s + l.qty * l.sale_price, 0);
  const lineOffTotal = cart.reduce((s, l) => s + l.qty * l.sale_price * (l.off / 100), 0);
  const afterLines = gross - lineOffTotal;
  const orderOffValue = orderOff.mode === 'pct' ? afterLines * (orderOff.value / 100) : Math.min(orderOff.value, afterLines);
  const net = afterLines - orderOffValue;
  const cost = cart.reduce((s, l) => s + l.qty * l.cost_price, 0);
  const profit = net - cost;
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const overstock = cart.filter(l => l.qty > stockFor(l));
  const totalOffPct = gross > 0 ? ((gross - net) / gross) * 100 : 0;
  const cashSessionId = cashSessionByStore[storeId] ?? null;
  const needsCashSession = payment === 'dinheiro' && !cashSessionId;
  const canConfirm = cart.length > 0 && overstock.length === 0 && !needsCashSession;

  const confirm = () => {
    setError('');
    if (!canConfirm) return;
    startTransition(async () => {
      const result = await confirmSaleAction({
        storeId,
        customerId: null,
        paymentMethod: payment,
        installments: payment === 'credito' ? parseInt(installments, 10) || 1 : 1,
        cashSessionId: payment === 'dinheiro' ? cashSessionId : null,
        notes,
        items: cart.map((l) => ({ productId: l.id, qty: l.qty, unitPrice: l.sale_price, discountPct: l.off })),
        orderDiscountAmount: orderOffValue,
      });
      if (result?.error) { setError(result.error); return; }
      navigate(`/receipt?id=${result.id}`);
    });
  };

  return (
    <StoreShell route="/stock/sale" breadcrumb={['Estoque', 'Venda']} navigate={navigate}>
      <PageHeader
        title="Nova venda"
        sub="Busque o produto pelo SKU, código de barras ou nome para adicionar ao carrinho."
        actions={(
          <button onClick={() => setCart([])} className="btn btn-ghost btn-sm">Limpar carrinho</button>
        )}
      />
      <Page>
        <MovementNav route="/stock/sale" navigate={navigate} />

        <div className="split-aside" style={{ '--aside': '340px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <ProductPicker product={null} storeId={storeId} onSelect={addItem} />
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Carrinho</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'} · {units} {units === 1 ? 'unidade' : 'unidades'}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{brl(net)}</span>
              </div>

              {cart.length === 0 ? (
                <EmptyState
                  icon={<I.Box size={18} />}
                  title="Carrinho vazio"
                  desc="Busque um produto acima para começar o atendimento."
                />
              ) : (
                <div className="table-scroll"><table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th><th>Variação</th>
                      <th className="num">Preço</th><th style={{ width: 118 }}>Qtd</th>
                      <th style={{ width: 92 }}>Desc.</th><th className="num">Subtotal</th><th style={{ width: 30 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l, i) => {
                      const stock = stockFor(l);
                      const short = l.qty > stock;
                      return (
                        <tr key={l.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ProductThumb category={l.category} brand={l.brand} attrs={l.attrs} size={28} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.brand} · {l.name}</div>
                                <div style={{ fontSize: 10, color: short ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {short ? `só ${stock} em estoque` : `${l.sku} · ${stock} disp.`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><AttrChip value={variantLabel(l.attrs || {})} /></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(l.sale_price)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <button onClick={() => l.qty > 1 ? setLine(i, { qty: l.qty - 1 }) : removeLine(i)}
                                className="btn btn-outline btn-sm" style={{ width: 24, padding: 0, justifyContent: 'center' }}>−</button>
                              <input className="input" type="number" value={l.qty}
                                onChange={(e) => setLine(i, { qty: Math.max(1, +e.target.value || 1) })}
                                style={{ width: 46, height: 26, textAlign: 'center', padding: 0, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                              <button onClick={() => setLine(i, { qty: l.qty + 1 })}
                                className="btn btn-outline btn-sm" style={{ width: 24, padding: 0, justifyContent: 'center' }}>+</button>
                            </div>
                          </td>
                          <td>
                            <div style={{ position: 'relative' }}>
                              <input className="input" type="number" value={l.off}
                                onChange={(e) => setLine(i, { off: Math.min(100, Math.max(0, +e.target.value || 0)) })}
                                style={{ height: 26, paddingRight: 20, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                              <span style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)', pointerEvents: 'none' }}>%</span>
                            </div>
                          </td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{brl(lineNet(l))}</td>
                          <td><button onClick={() => removeLine(i)} className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              )}
            </div>

            {overstock.length > 0 && (
              <div style={{
                display: 'flex', gap: 11, alignItems: 'center',
                padding: '11px 14px', background: 'var(--danger-soft)',
                border: '1px solid var(--danger)', borderRadius: 8,
              }}>
                <span style={{ color: 'var(--danger)', flexShrink: 0 }}><I.Alert size={15} /></span>
                <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
                  <strong>{overstock[0].name}</strong> tem só {stockFor(overstock[0])} em estoque nesta unidade.
                  Reduza a quantidade ou transfira de outra loja.
                </span>
                <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm">Transferir</button>
              </div>
            )}

            <FormCard title="Dados do atendimento" cols={3}>
              <Field label="Unidade" span={1}>
                <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Cliente" span={2} hint="Cadastro de clientes chega na próxima etapa — por ora, venda de consumidor final.">
                <TextInput value="Consumidor final" disabled />
              </Field>
              <Field label="Observações" span={3}>
                <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: cliente pediu nota no CNPJ da empresa." />
              </Field>
            </FormCard>
          </div>

          <div data-sticky style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo</div>
              <SummaryRow label={`${units} ${units === 1 ? 'unidade' : 'unidades'}`} value={brl(gross)} />
              {lineOffTotal > 0 && <SummaryRow label="Descontos por item" value={'− ' + brl(lineOffTotal)} tone="warning" />}
              {orderOffValue > 0 && (
                <SummaryRow label={orderOff.mode === 'pct' ? `Desconto geral ${orderOff.value}%` : 'Desconto geral'} value={'− ' + brl(orderOffValue)} tone="warning" />
              )}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Total a cobrar" value={brl(net)} strong />
              </div>
              {totalOffPct > 0 && (
                <div style={{ fontSize: 11, color: totalOffPct > 20 ? 'var(--warning)' : 'var(--fg-muted)', marginTop: 6 }}>
                  Desconto total de {totalOffPct.toFixed(1)}%{totalOffPct > 20 ? ' — exige aprovação do gestor.' : '.'}
                </div>
              )}
              <button onClick={() => setDiscountOpen(true)} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                <I.Tag size={12} /> {orderOffValue > 0 ? 'Editar desconto geral' : 'Desconto no total'}
              </button>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Pagamento</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PAYMENTS.map((m) => (
                  <button key={m.value} onClick={() => setPayment(m.value)} style={{
                    padding: '8px 9px', fontSize: 12, fontWeight: 500,
                    border: '1px solid ' + (payment === m.value ? 'var(--accent)' : 'var(--line)'),
                    background: payment === m.value ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    color: payment === m.value ? 'var(--accent-text)' : 'var(--fg)',
                    borderRadius: 6,
                  }}>{m.label}</button>
                ))}
              </div>
              {payment === 'credito' && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Parcelas">
                    <SelectInput value={installments} onChange={setInstallments} options={['1×', '2×', '3×', '4×', '6×', '10×', '12×']} />
                  </Field>
                </div>
              )}
              {payment === 'dinheiro' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {needsCashSession ? (
                    <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                      Nenhum caixa aberto nesta unidade — abra o caixa antes de vender em dinheiro.
                    </div>
                  ) : (
                    <>
                      <Field label="Valor recebido"><TextInput mono prefix="R$" type="number" value={received} onChange={(e) => setReceived(+e.target.value || 0)} /></Field>
                      <SummaryRow label="Troco" value={brl(Math.max(0, received - net))} strong tone="success" />
                    </>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12, color: 'var(--fg)' }}>
                {error}
              </div>
            )}

            <button onClick={confirm} className="btn btn-primary btn-lg"
              disabled={!canConfirm || pending}
              style={{ justifyContent: 'center', width: '100%', opacity: canConfirm && !pending ? 1 : 0.45 }}>
              {overstock.length ? 'Estoque insuficiente' : needsCashSession ? 'Abra o caixa primeiro' : pending ? 'Confirmando…' : cart.length ? `Confirmar venda · ${brl(net)}` : 'Carrinho vazio'}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar atendimento</button>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Margem do atendimento</div>
              <SummaryRow label="Custo da mercadoria" value={brl(cost)} />
              <SummaryRow label="Lucro bruto" value={brl(profit)} tone={profit > 0 ? 'success' : 'danger'} />
              <SummaryRow label="Margem" value={net > 0 ? ((profit / net) * 100).toFixed(1) + '%' : '—'} tone={profit / net > 0.3 ? 'success' : 'warning'} />
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 8, lineHeight: 1.5 }}>
                Visível apenas para Gestor Financeiro e Proprietário.
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={discountOpen} onClose={() => setDiscountOpen(false)}
          title="Desconto no total" desc={`Aplicado sobre ${brl(afterLines)}, depois dos descontos por item.`}
          footer={(
            <>
              <button onClick={() => { setOrderOff({ mode: 'pct', value: 0 }); setDiscountOpen(false); }} className="btn btn-ghost">Remover desconto</button>
              <button onClick={() => setDiscountOpen(false)} className="btn btn-primary">Aplicar</button>
            </>
          )}
        >
          <Field label="Tipo de desconto">
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
              {[{ k: 'pct', l: 'Percentual (%)' }, { k: 'brl', l: 'Valor fixo (R$)' }].map(o => (
                <button key={o.k} onClick={() => setOrderOff(d => ({ ...d, mode: o.k, value: 0 }))} style={{
                  flex: 1, background: orderOff.mode === o.k ? 'var(--bg-elev)' : 'transparent',
                  border: '1px solid ' + (orderOff.mode === o.k ? 'var(--line)' : 'transparent'),
                  borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                  color: orderOff.mode === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                }}>{o.l}</button>
              ))}
            </div>
          </Field>

          {orderOff.mode === 'pct' ? (
            <Field label="Percentual" hint="Descontos acima de 20% exigem aprovação do gestor.">
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 5, 10, 15, 20].map(v => (
                  <button key={v} onClick={() => setOrderOff(d => ({ ...d, value: v }))} style={{
                    flex: 1, padding: '7px 0',
                    background: orderOff.value === v ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    border: '1px solid ' + (orderOff.value === v ? 'var(--accent)' : 'var(--line)'),
                    borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500,
                    color: orderOff.value === v ? 'var(--accent-text)' : 'var(--fg)',
                  }}>{v}%</button>
                ))}
              </div>
              <TextInput mono type="number" value={orderOff.value} onChange={(e) => setOrderOff(d => ({ ...d, value: +e.target.value || 0 }))} suffix="%" style={{ marginTop: 8 }} />
            </Field>
          ) : (
            <Field label="Valor do desconto">
              <TextInput mono prefix="R$" type="number" value={orderOff.value} onChange={(e) => setOrderOff(d => ({ ...d, value: +e.target.value || 0 }))} />
            </Field>
          )}

          <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: '12px 14px' }}>
            <SummaryRow label="Bruto do carrinho" value={brl(gross)} />
            <SummaryRow label="Descontos por item" value={'− ' + brl(lineOffTotal)} tone="warning" />
            <SummaryRow label="Desconto geral" value={'− ' + brl(orderOffValue)} tone="warning" />
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
              <SummaryRow label="Total final" value={brl(net)} strong />
            </div>
            <div style={{ fontSize: 11, color: profit > 0 ? 'var(--fg-muted)' : 'var(--danger)', marginTop: 8 }}>
              {profit > 0
                ? `Margem após descontos: ${((profit / net) * 100 || 0).toFixed(1)}%`
                : 'Atenção: este desconto vende abaixo do custo.'}
            </div>
          </div>
        </Modal>
      </Page>
    </StoreShell>
  );
}
