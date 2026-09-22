"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { confirmSaleAction } from '@/features/pos/actions';

const DISCOUNT_STEPS = [0, 5, 10, 15, 20];
const PAYMENTS = [
  { label: 'Cartão', value: 'credito' },
  { label: 'PIX', value: 'pix' },
  { label: 'Dinheiro', value: 'dinheiro' },
];

export function TabletPOS({ stores, categories, products, cashSessionByStore, operatorName }) {
  const navigate = useNavigate();
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? '');
  const [cat, setCat] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [cart, setCart] = React.useState([]);
  const [payment, setPayment] = React.useState('credito');
  const [discountPct, setDiscountPct] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const term = query.trim().toLowerCase();
  const shown = products.filter((p) => {
    if (cat !== 'all' && p.category?.id !== cat) return false;
    if (term && !`${p.sku} ${p.brand} ${p.name}`.toLowerCase().includes(term)) return false;
    return true;
  });

  const stockFor = (p) => p.stock_balances?.find((b) => b.store_id === storeId)?.qty ?? 0;
  const add = (p) => setCart((c) => {
    const at = c.findIndex((l) => l.product.id === p.id);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { product: p, qty: 1 }];
  });
  const bump = (i, d) => setCart((c) => c.map((l, j) => (j === i ? { ...l, qty: Math.max(0, l.qty + d) } : l)).filter((l) => l.qty > 0));

  const gross = cart.reduce((s, l) => s + l.qty * l.product.sale_price, 0);
  const discountAmount = gross * (discountPct / 100);
  const net = gross - discountAmount;
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const overstock = cart.filter((l) => l.qty > stockFor(l.product));
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
        installments: 1,
        cashSessionId: payment === 'dinheiro' ? cashSessionId : null,
        notes: '',
        items: cart.map((l) => ({ productId: l.product.id, qty: l.qty, unitPrice: l.product.sale_price, discountPct: 0 })),
        orderDiscountAmount: discountAmount,
      });
      if (result?.error) { setError(result.error); return; }
      navigate(`/receipt?id=${result.id}`);
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E7E4DD', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1024 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#5C574F' }}>Modo balcão · tablet 1024 × 768 · alvos de toque de 56 px</span>
          <div style={{ flex: 1 }}></div>
          <button onClick={() => navigate('/stock/sale')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#16140F', border: '1px solid #C9C4BA', cursor: 'pointer' }}>Abrir versão desktop</button>
          <button onClick={() => navigate('/dashboard')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: 'transparent', color: '#5C574F', border: '1px solid transparent', cursor: 'pointer' }}>Sair do modo balcão</button>
        </div>

        {/* Tablet bezel */}
        <div style={{
          background: '#1c1a16', borderRadius: 26, padding: 14,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 24px 56px rgba(20,18,13,0.30)',
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: 14, overflow: 'hidden',
            height: 768, display: 'grid', gridTemplateColumns: '1fr 372px',
          }}>
            {/* LEFT: catalogue */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--line)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.Brand size={24} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.012em' }}>{stores.find((s) => s.id === storeId)?.name || 'Loja'}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{operatorName}</div>
                </div>
                <div style={{ flex: 1 }}></div>
                {stores.length > 1 && (
                  <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ height: 40, width: 160 }}>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                <button onClick={() => navigate('/cash')} className="btn btn-outline" style={{ height: 40 }}>
                  <I.Credit size={15} /> Caixa
                </button>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
                    <I.QR size={17} />
                  </span>
                  <input className="input" placeholder="Bipe o produto ou busque por nome/SKU"
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    style={{ paddingLeft: 42, height: 52, fontSize: 15 }} />
                </div>
                <div className="no-bars" style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                  {[{ id: 'all', name: 'Tudo', icon: 'Grid' }, ...categories].map(c => {
                    const on = cat === c.id;
                    const Ico = I[c.icon] || I.Box;
                    return (
                      <button key={c.id} onClick={() => setCat(c.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 40, padding: '0 14px', flexShrink: 0,
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        color: on ? 'var(--accent-text)' : 'var(--fg-muted)',
                        borderRadius: 8, fontSize: 13, fontWeight: on ? 500 : 400,
                      }}>
                        <Ico size={14} /> {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="no-bars" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {shown.length === 0 ? (
                  <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>Nenhum produto encontrado.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {shown.map(p => (
                      <button key={p.id} data-testid="pos-product" onClick={() => add(p)} style={{
                        display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left',
                        padding: 12, minHeight: 128,
                        border: '1px solid var(--line)', background: 'var(--bg-elev)',
                        borderRadius: 10,
                      }}>
                        <ProductThumb category={p.category} brand={p.brand} attrs={p.attrs} size={34} />
                        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 10, lineHeight: 1.3, color: 'var(--fg)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 3 }}>{variantLabel(p.attrs || {})}</div>
                        <div style={{ flex: 1 }}></div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.015em', color: 'var(--fg)' }}>{brl(p.sale_price)}</span>
                          <span style={{ fontSize: 10.5, color: stockFor(p) < 25 ? 'var(--warning)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{stockFor(p)} un</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: cart + payment */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-elev)', minWidth: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Atendimento</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'} · {units} un
                  </div>
                </div>
                <div style={{ flex: 1 }}></div>
                <button onClick={() => setCart([])} className="btn btn-ghost" style={{ height: 40 }}>Limpar</button>
              </div>

              <div className="no-bars" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {cart.length === 0 ? (
                  <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6 }}>
                    Toque num produto<br/>ou bipe o código de barras.
                  </div>
                ) : cart.map((l, i) => {
                  const short = l.qty > stockFor(l.product);
                  return (
                    <div key={l.product.id} data-testid="pos-cart-item" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 10px', marginBottom: 6,
                      background: 'var(--bg)', border: '1px solid ' + (short ? 'var(--danger)' : 'var(--line)'), borderRadius: 9,
                    }}>
                      <ProductThumb category={l.product.category} brand={l.product.brand} attrs={l.product.attrs} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{l.product.name}</div>
                        <div style={{ fontSize: 11, color: short ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                          {short ? `só ${stockFor(l.product)} em estoque` : brl(l.product.sale_price)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => bump(i, -1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>−</button>
                        <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{l.qty}</span>
                        <button onClick={() => bump(i, 1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>+</button>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: 74, textAlign: 'right' }}>{brl(l.qty * l.product.sale_price)}</span>
                    </div>
                  );
                })}
              </div>

              {overstock.length > 0 && (
                <div style={{ margin: '0 12px 10px', padding: '9px 11px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 8, fontSize: 11.5, color: 'var(--fg)' }}>
                  Estoque insuficiente para {overstock.length === 1 ? 'um item' : `${overstock.length} itens`}.
                </div>
              )}

              <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 8 }}>Pagamento</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                  {PAYMENTS.map((m) => (
                    <button key={m.value} onClick={() => setPayment(m.value)} style={{
                      height: 44, fontSize: 12.5, fontWeight: 500,
                      border: '1px solid ' + (payment === m.value ? 'var(--accent)' : 'var(--line)'),
                      background: payment === m.value ? 'var(--accent-soft)' : 'var(--bg)',
                      color: payment === m.value ? 'var(--accent-text)' : 'var(--fg)',
                      borderRadius: 8,
                    }}>{m.label}</button>
                  ))}
                </div>
                {needsCashSession && (
                  <div style={{ fontSize: 11.5, color: 'var(--danger)', marginBottom: 4 }}>Abra o caixa antes de vender em dinheiro.</div>
                )}
              </div>

              <div style={{ padding: 14, borderTop: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--warning)', marginBottom: 6 }}>
                    <span>Desconto {discountPct}%</span><span>− {brl(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total</span>
                  <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{brl(net)}</span>
                </div>
                {error && (
                  <div style={{ marginBottom: 10, padding: '9px 11px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
                )}
                <button onClick={confirm} className="btn btn-primary" disabled={!canConfirm || pending}
                  style={{ width: '100%', height: 56, justifyContent: 'center', fontSize: 15, opacity: canConfirm && !pending ? 1 : 0.45 }}>
                  {pending ? 'Confirmando…' : overstock.length ? 'Estoque insuficiente' : 'Cobrar e finalizar'}
                </button>
                <button
                  onClick={() => setDiscountPct((d) => DISCOUNT_STEPS[(DISCOUNT_STEPS.indexOf(d) + 1) % DISCOUNT_STEPS.length])}
                  className="btn btn-outline" style={{ width: '100%', height: 44, justifyContent: 'center', marginTop: 8 }}
                >
                  <I.Tag size={12} /> Desconto {discountPct > 0 ? `· ${discountPct}%` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
