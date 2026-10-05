"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { useDefaultStoreId, useShell } from '@/components/layout/shell-context';
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
import { confirmSaleAction, requestDiscountApprovalAction } from '@/features/pos/actions';
import { useCan } from '@/hooks/use-can';
import { CustomerField } from '@/features/stock/customer-field';
import { PaymentSplit } from '@/features/pos/payment-split';
import { validatePayments } from '@/lib/payment-methods';

// Espelha has_access('money', 2) do banco: financeiro e proprietário vendem
// com qualquer desconto e veem custo/margem; os demais precisam de aprovação
// acima de 20% (fn_confirm_sale confere de novo no servidor).
const MANAGER_ROLES = ['financeiro', 'proprietario'];
const APPROVAL_THRESHOLD = 20;


export function StockSale({ stores, cashSessionByStore, initialProduct, initialCustomer }) {
  const navigate = useNavigate();
  const canGo = useCan();
  const defaultStoreId = useDefaultStoreId(stores);
  const shell = useShell();
  const isManager = MANAGER_ROLES.includes(shell?.user?.roleId);
  // Rede sem controle de caixa: dinheiro não exige caixa aberto.
  const cashControl = shell?.tenant?.cash_control !== false;
  const [customer, setCustomer] = React.useState(initialCustomer ?? null);
  const [approval, setApproval] = React.useState(null);
  const [approvalOpen, setApprovalOpen] = React.useState(false);
  const [manager, setManager] = React.useState({ email: '', password: '', code: '' });
  const [approvalError, setApprovalError] = React.useState('');
  const [approving, setApproving] = React.useState(false);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [cart, setCart] = React.useState(() => (initialProduct
    ? [{ ...initialProduct, price: Number(initialProduct.effective_price ?? initialProduct.sale_price), qty: 1, off: 0 }]
    : []));
  const [orderOff, setOrderOff] = React.useState({ mode: 'pct', value: 0 });
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [payments, setPayments] = React.useState([{ method: 'credito', amount: 0, installments: 1 }]);
  const [received, setReceived] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const stockFor = (p) => p.stock_balances?.find((b) => b.store_id === storeId)?.qty ?? 0;

  const setLine = (i, patch) => setCart(c => c.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setCart(c => c.filter((_, j) => j !== i));
  const addItem = (p) => setCart(c => {
    const at = c.findIndex(l => l.id === p.id);
    // Preço cobrado = preço efetivo do banco (promoção ativa, se houver).
    const price = Number(p.effective_price ?? p.sale_price);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { ...p, price, qty: 1, off: 0 }];
  });

  const lineNet = (l) => l.qty * l.price * (1 - l.off / 100);
  const gross = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const lineOffTotal = cart.reduce((s, l) => s + l.qty * l.price * (l.off / 100), 0);
  const afterLines = gross - lineOffTotal;
  const orderOffValue = orderOff.mode === 'pct' ? afterLines * (orderOff.value / 100) : Math.min(orderOff.value, afterLines);
  const net = afterLines - orderOffValue;
  const cost = cart.reduce((s, l) => s + l.qty * l.cost_price, 0);
  const profit = net - cost;
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const overstock = cart.filter(l => l.qty > stockFor(l));
  const totalOffPct = gross > 0 ? ((gross - net) / gross) * 100 : 0;
  const cashSessionId = cashSessionByStore[storeId] ?? null;
  const cashPart = payments.filter((p) => p.method === 'dinheiro').reduce((s, p) => s + Number(p.amount || 0), 0);
  const needsCashSession = cashControl && cashPart > 0 && !cashSessionId;
  const netRounded = Math.round(net * 100) / 100;
  const paymentError = cart.length && netRounded > 0 ? validatePayments(payments, netRounded, { customerId: customer?.id ?? null }) : null;
  const creditOver = payments.filter((p) => p.method === 'credito_loja').reduce((s, p) => s + Number(p.amount || 0), 0) > Number(customer?.credit_balance ?? 0) + 0.01;
  const canConfirm = cart.length > 0 && overstock.length === 0 && !needsCashSession && !paymentError && !creditOver;
  // Arredonda como o banco (2 casas) pra não pedir aprovação por centavo.
  const offPct = Math.round(totalOffPct * 100) / 100;
  const needsApproval = !isManager && offPct > APPROVAL_THRESHOLD;
  const approvalCovers = Boolean(approval && approval.storeId === storeId && approval.maxPct >= offPct);

  const requestApproval = () => {
    setApprovalError('');
    setApproving(true);
    requestDiscountApprovalAction({ ...manager, storeId, maxPct: offPct })
      .then((res) => {
        if (res?.error) { setApprovalError(res.error); return; }
        setApproval({ id: res.approvalId, maxPct: offPct, storeId });
        setManager({ email: '', password: '', code: '' });
        setApprovalOpen(false);
      })
      .catch(() => setApprovalError('Não foi possível validar o gestor agora. Tente de novo.'))
      .finally(() => setApproving(false));
  };

  const confirm = () => {
    setError('');
    if (!canConfirm) return;
    if (needsApproval && !approvalCovers) { setApprovalOpen(true); return; }
    startTransition(async () => {
      const result = await confirmSaleAction({
        storeId,
        customerId: customer?.id ?? null,
        payments: netRounded <= 0 ? [] : payments.map((p) => ({ method: p.method, amount: Number(p.amount), installments: p.installments ?? 1 })),
        notes,
        items: cart.map((l) => ({ productId: l.id, qty: l.qty, unitPrice: l.price, discountPct: l.off })),
        orderDiscountAmount: orderOffValue,
        discountApprovalId: needsApproval ? approval?.id ?? null : null,
      });
      if (result?.error) {
        // Aprovação é de uso único; erro ligado a ela exige pedir de novo.
        if (/aprova/i.test(result.error)) setApproval(null);
        setError(result.error);
        return;
      }
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
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.brand ? `${l.brand} · ` : ''}{l.name}</div>
                                <div style={{ fontSize: 10, color: short ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {short ? `só ${stock} em estoque` : `${l.sku} · ${stock} disp.`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><AttrChip value={variantLabel(l.attrs || {})} /></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
                            {l.price < Number(l.sale_price) ? (
                              <span title={l.promotion_name ? `Promoção: ${l.promotion_name}` : 'Promoção ativa'}>
                                <s style={{ opacity: 0.6 }}>{brl(Number(l.sale_price))}</s>{' '}
                                <span style={{ color: 'var(--success)', fontWeight: 500 }}>{brl(l.price)}</span>
                              </span>
                            ) : brl(l.price)}
                          </td>
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
                {canGo('/stock/transfer') && (<button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm">Transferir</button>)}
              </div>
            )}

            <FormCard title="Dados do atendimento" cols={3}>
              <Field label="Unidade" span={1}>
                <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Cliente" span={2} hint="Opcional. Sem cliente, a venda sai como consumidor final.">
                <CustomerField customer={customer} onChange={setCustomer} />
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
                <div style={{ fontSize: 11, color: needsApproval && !approvalCovers ? 'var(--warning)' : 'var(--fg-muted)', marginTop: 6 }}>
                  Desconto total de {totalOffPct.toFixed(1)}%
                  {needsApproval ? (approvalCovers ? ` — aprovado pelo gestor (até ${approval.maxPct}%).` : ' — exige aprovação do gestor.') : '.'}
                </div>
              )}
              <button onClick={() => setDiscountOpen(true)} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                <I.Tag size={12} /> {orderOffValue > 0 ? 'Editar desconto geral' : 'Desconto no total'}
              </button>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Pagamento</div>
              <PaymentSplit total={netRounded} value={payments} onChange={setPayments} customer={customer}
                cashBlocked={cashControl && !cashSessionId ? 'Caixa fechado' : null} />
              {cashPart > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {needsCashSession ? (
                    <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                      Nenhum caixa aberto nesta unidade — abra o caixa antes de vender em dinheiro.
                    </div>
                  ) : (
                    <>
                      <Field label="Valor recebido"><TextInput mono prefix="R$" type="number" value={received} onChange={(e) => setReceived(+e.target.value || 0)} /></Field>
                      <SummaryRow label="Troco" value={brl(Math.max(0, received - cashPart))} strong tone="success" />
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
              {overstock.length ? 'Estoque insuficiente' : needsCashSession ? 'Abra o caixa primeiro' : pending ? 'Confirmando…'
                : cart.length && (paymentError || creditOver) ? 'Ajuste o pagamento'
                : !cart.length ? 'Carrinho vazio' : needsApproval && !approvalCovers ? 'Pedir aprovação do gestor' : `Confirmar venda · ${brl(net)}`}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar atendimento</button>

            {isManager && <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Margem do atendimento</div>
              <SummaryRow label="Custo da mercadoria" value={brl(cost)} />
              <SummaryRow label="Lucro bruto" value={brl(profit)} tone={profit > 0 ? 'success' : 'danger'} />
              <SummaryRow label="Margem" value={net > 0 ? ((profit / net) * 100).toFixed(1) + '%' : '—'} tone={profit / net > 0.3 ? 'success' : 'warning'} />
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 8, lineHeight: 1.5 }}>
                Visível apenas para Gestor Financeiro e Proprietário.
              </div>
            </div>}
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
            <Field label="Percentual" hint={isManager ? undefined : 'Descontos acima de 20% exigem aprovação do gestor.'}>
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
              {!isManager ? null : profit > 0
                ? `Margem após descontos: ${((profit / net) * 100 || 0).toFixed(1)}%`
                : 'Atenção: este desconto vende abaixo do custo.'}
            </div>
          </div>
        </Modal>

        <Modal
          open={approvalOpen} onClose={() => { setApprovalOpen(false); setApprovalError(''); }}
          title="Aprovação do gestor"
          desc={`Desconto de ${offPct.toFixed(1)}% passa do limite de ${APPROVAL_THRESHOLD}%. Um gestor (financeiro ou proprietário) confirma com o próprio login — sua sessão continua aberta.`}
          footer={(
            <>
              <button type="button" onClick={() => { setApprovalOpen(false); setApprovalError(''); }} className="btn btn-ghost">Cancelar</button>
              <button type="submit" form="discount-approval" disabled={approving || !manager.email || !manager.password} className="btn btn-primary">
                {approving ? 'Validando…' : 'Aprovar desconto'}
              </button>
            </>
          )}
        >
          <form id="discount-approval" onSubmit={(e) => { e.preventDefault(); requestApproval(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Email do gestor">
              <TextInput type="email" autoComplete="off" value={manager.email} onChange={(e) => setManager((m) => ({ ...m, email: e.target.value }))} />
            </Field>
            <Field label="Senha do gestor">
              <TextInput type="password" autoComplete="new-password" value={manager.password} onChange={(e) => setManager((m) => ({ ...m, password: e.target.value }))} />
            </Field>
            <Field label="Código 2FA do gestor" hint="Só se o gestor usa verificação em duas etapas">
              <TextInput mono inputMode="numeric" autoComplete="off" placeholder="000 000" value={manager.code} onChange={(e) => setManager((m) => ({ ...m, code: e.target.value }))} />
            </Field>
            {approvalError && <div role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{approvalError}</div>}
          </form>
        </Modal>
      </Page>
    </StoreShell>
  );
}
