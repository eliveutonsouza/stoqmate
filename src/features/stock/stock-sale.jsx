"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { POS_SUGGEST } from '@/features/stock/pos-suggest';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { ProductThumb } from '@/components/ui/product-thumb';
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

export function StockSale() {
  const navigate = useNavigate();
  const [cart, setCart] = React.useState([
    { ...POS_SUGGEST[0], qty: 1, off: 0 },
    { ...POS_SUGGEST[1], qty: 3, off: 0 },
    { ...POS_SUGGEST[3], qty: 12, off: 10 },
  ]);
  const [orderOff, setOrderOff] = React.useState({ mode: 'pct', value: 0 });
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [payment, setPayment] = React.useState('Cartão de crédito');

  const setLine = (i, patch) => setCart(c => c.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setCart(c => c.filter((_, j) => j !== i));
  const addItem = (p) => setCart(c => {
    const at = c.findIndex(l => l.sku === p.sku);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { ...p, qty: 1, off: 0 }];
  });

  const lineNet = (l) => l.qty * l.sale * (1 - l.off / 100);
  const gross = cart.reduce((s, l) => s + l.qty * l.sale, 0);
  const lineOffTotal = cart.reduce((s, l) => s + l.qty * l.sale * (l.off / 100), 0);
  const afterLines = gross - lineOffTotal;
  const orderOffValue = orderOff.mode === 'pct' ? afterLines * (orderOff.value / 100) : Math.min(orderOff.value, afterLines);
  const net = afterLines - orderOffValue;
  const cost = cart.reduce((s, l) => s + l.qty * l.purchase, 0);
  const profit = net - cost;
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const overstock = cart.filter(l => l.qty > l.stock);
  const totalOffPct = gross > 0 ? ((gross - net) / gross) * 100 : 0;

  return (
    <StoreShell route="/stock/sale" breadcrumb={['Estoque', 'Venda']} navigate={navigate}>
      <PageHeader
        title="Nova venda"
        sub="Atendimento #4287 · Loja Centro · balcão 01"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.QR size={13} /> Leitor conectado</button>
            <button onClick={() => setCart([])} className="btn btn-ghost btn-sm">Limpar carrinho</button>
          </>
        )}
      />
      <Page>
        <MovementNav route="/stock/sale" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
                  <I.Search size={15} />
                </span>
                <input className="input" placeholder="Bipe o código de barras ou busque por SKU, marca ou nome…"
                  style={{ paddingLeft: 38, paddingRight: 70, height: 42, fontSize: 14 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                  <span className="kbd">⌘</span><span className="kbd">K</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginRight: 2 }}>Mais vendidos hoje</span>
                {POS_SUGGEST.map(p => (
                  <button key={p.sku} onClick={() => addItem(p)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    height: 30, padding: '0 10px 0 6px',
                    border: '1px solid var(--line)', background: 'var(--bg-elev)',
                    borderRadius: 6, fontSize: 12, color: 'var(--fg)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-elev)'; }}
                  >
                    <ProductThumb cat={p.cat} attrs={p.attrs} size={20} />
                    <span className="truncate" style={{ maxWidth: 130 }}>{p.name}</span>
                    <span style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{brl(p.sale)}</span>
                  </button>
                ))}
              </div>
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
                  desc="Bipe o código de barras do produto ou use os atalhos acima para começar o atendimento."
                />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th><th>Variação</th>
                      <th className="num">Preço</th><th style={{ width: 118 }}>Qtd</th>
                      <th style={{ width: 92 }}>Desc.</th><th className="num">Subtotal</th><th style={{ width: 30 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l, i) => {
                      const short = l.qty > l.stock;
                      return (
                        <tr key={l.sku}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ProductThumb cat={l.cat} attrs={l.attrs} size={28} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                                <div style={{ fontSize: 10, color: short ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {short ? `só ${l.stock} em estoque` : `${l.sku} · ${l.stock} disp.`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><AttrChip value={variantLabel(l.attrs)} /></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(l.sale)}</td>
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
                </table>
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
                  <strong>{overstock[0].name}</strong> tem só {overstock[0].stock} em estoque nesta unidade.
                  Reduza a quantidade ou transfira de outra loja.
                </span>
                <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm">Transferir</button>
              </div>
            )}

            <FormCard title="Dados do atendimento" cols={3}>
              <Field label="Vendedor" span={1}>
                <SelectInput value="Lucas Prado" onChange={() => {}} options={['Lucas Prado', 'Marina Alves', 'Ana Ribeiro']} />
              </Field>
              <Field label="Cliente" span={1} hint="Opcional — permite histórico e troca sem nota.">
                <TextInput placeholder="CPF ou nome" />
              </Field>
              <Field label="Data" span={1}>
                <TextInput type="date" defaultValue="2026-09-18" />
              </Field>
              <Field label="Observações" span={3}>
                <TextareaInput placeholder="Ex.: cliente pediu nota no CNPJ da empresa." />
              </Field>
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                {['Dinheiro', 'PIX', 'Débito', 'Cartão de crédito', 'Crediário', 'Dividido'].map(m => (
                  <button key={m} onClick={() => setPayment(m)} style={{
                    padding: '8px 9px', fontSize: 12, fontWeight: 500,
                    border: '1px solid ' + (payment === m ? 'var(--accent)' : 'var(--line)'),
                    background: payment === m ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    color: payment === m ? 'var(--accent-text)' : 'var(--fg)',
                    borderRadius: 6,
                  }}>{m}</button>
                ))}
              </div>
              {payment === 'Cartão de crédito' && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Parcelas">
                    <SelectInput value="3×" onChange={() => {}} options={['1×', '2×', '3×', '4×', '6×', '10×', '12×']} />
                  </Field>
                </div>
              )}
              {payment === 'Dinheiro' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="Valor recebido"><TextInput mono prefix="R$" defaultValue="500,00" /></Field>
                  <SummaryRow label="Troco" value={brl(Math.max(0, 500 - net))} strong tone="success" />
                </div>
              )}
            </div>

            <button onClick={() => navigate('/stock/movement')} className="btn btn-primary btn-lg"
              disabled={cart.length === 0 || overstock.length > 0}
              style={{ justifyContent: 'center', width: '100%', opacity: cart.length && !overstock.length ? 1 : 0.45 }}>
              {overstock.length ? 'Estoque insuficiente' : cart.length ? `Confirmar venda · ${brl(net)}` : 'Carrinho vazio'}
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


// === Transfer between stores ===
