"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { useDefaultStoreId, useShell } from '@/components/layout/shell-context';
import { SALE_METHODS } from '@/lib/payment-methods';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { confirmSaleAction } from '@/features/pos/actions';
import { createClient } from '@/lib/supabase/client';

const DISCOUNT_STEPS = [0, 5, 10, 15, 20];

// Preço efetivo (promoção ativa) — o mesmo que fn_confirm_sale cobra.
const priceOf = (p) => Number(p.effective_price ?? p.sale_price);
// Tablet é o atendimento rápido: uma forma por venda e sem cliente
// identificado (crédito da loja e divisão ficam na venda do desktop).
const PAYMENTS = SALE_METHODS.filter((m) => !m.needsCustomer);

export function TabletPOS({ stores, categories, products, cashSessionByStore, operatorName }) {
  const navigate = useNavigate();
  const defaultStoreId = useDefaultStoreId(stores);
  const cashControl = useShell()?.tenant?.cash_control !== false;
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [cat, setCat] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [cart, setCart] = React.useState([]);
  const [payment, setPayment] = React.useState('credito');
  const [discountPct, setDiscountPct] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const cartRef = React.useRef(null);

  // A grade inicial traz só uma amostra do catálogo; com 2+ letras a busca
  // vai ao banco (nome, SKU, marca ou código de barras — mesmo fn_search_products
  // do seletor de produto), então acha qualquer item da rede.
  const term = query.trim();
  const [search, setSearch] = React.useState({ term: '', rows: [], error: false });
  React.useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const { data, error } = await createClient().rpc('fn_search_products', { p_term: term.replace(/[%_]/g, ''), p_limit: 50 });
      if (!cancelled) setSearch({ term, rows: error ? [] : data ?? [], error: Boolean(error) });
    }, 200);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [term]);
  const searchingMode = term.length >= 2;
  const searching = searchingMode && search.term !== term;
  const searchError = searchingMode && !searching && search.error;
  const found = searchingMode && !searching ? search.rows : null;
  const shown = (searchingMode ? (found ?? []) : products).filter((p) => cat === 'all' || p.category?.id === cat);

  const stockFor = (p) => p.stock_balances?.find((b) => b.store_id === storeId)?.qty ?? 0;
  const add = (p) => setCart((c) => {
    const at = c.findIndex((l) => l.product.id === p.id);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { product: p, qty: 1 }];
  });
  const bump = (i, d) => setCart((c) => c.map((l, j) => (j === i ? { ...l, qty: Math.max(0, l.qty + d) } : l)).filter((l) => l.qty > 0));

  const gross = cart.reduce((s, l) => s + l.qty * priceOf(l.product), 0);
  const discountAmount = gross * (discountPct / 100);
  const net = gross - discountAmount;
  const units = cart.reduce((s, l) => s + l.qty, 0);
  const overstock = cart.filter((l) => l.qty > stockFor(l.product));
  const cashSessionId = cashSessionByStore[storeId] ?? null;
  const needsCashSession = cashControl && payment === 'dinheiro' && !cashSessionId;
  const total = Math.round(net * 100) / 100;
  const canConfirm = cart.length > 0 && overstock.length === 0 && !needsCashSession;

  const confirm = () => {
    setError('');
    if (!canConfirm) return;
    startTransition(async () => {
      const result = await confirmSaleAction({
        storeId,
        customerId: null,
        payments: total > 0 ? [{ method: payment, amount: total, installments: 1 }] : [],
        notes: '',
        items: cart.map((l) => ({ productId: l.product.id, qty: l.qty, unitPrice: priceOf(l.product), discountPct: 0 })),
        orderDiscountAmount: discountAmount,
      });
      if (result?.error) { setError(result.error); return; }
      navigate(`/receipt?id=${result.id}`);
    });
  };

  return (
    <div className="pos-page">
      <div className="pos-wrap" style={{ width: '100%', maxWidth: 1024 }}>
        <div className="pos-preview-bar" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#5C574F' }}>Modo balcão · tablet 1024 × 768 · alvos de toque de 56 px</span>
          <div style={{ flex: 1 }}></div>
          <button onClick={() => navigate('/stock/sale')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#16140F', border: '1px solid #C9C4BA', cursor: 'pointer' }}>Abrir versão desktop</button>
          <button onClick={() => navigate('/dashboard')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: 'transparent', color: '#5C574F', border: '1px solid transparent', cursor: 'pointer' }}>Sair do modo balcão</button>
        </div>

        {/* Tablet bezel */}
        <div className="pos-bezel">
          <div className="pos-screen">
            {/* LEFT: catalogue */}
            <div className="pos-catalog" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, borderRight: '1px solid var(--line)' }}>
              <div className="pos-head" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                <button onClick={() => navigate('/dashboard')} className="btn btn-ghost pos-touch-only" style={{ height: 40 }}>Sair</button>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
                    <I.QR size={17} />
                  </span>
                  <input className="input" placeholder="Bipe o produto ou busque por nome/SKU"
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    // Leitor de código de barras "digita" o código e manda Enter:
                    // código ou SKU exato entra direto no carrinho.
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || !found) return;
                      const code = term.toLowerCase();
                      const hit = found.find((p) => p.barcode?.toLowerCase() === code || p.sku.toLowerCase() === code)
                        ?? (found.length === 1 ? found[0] : null);
                      if (hit) { add(hit); setQuery(''); }
                    }}
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

              <div className="no-bars" data-pos-scroll style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {searching || searchError || shown.length === 0 ? (
                  <div role={searchError ? 'alert' : undefined} style={{ padding: '48px 16px', textAlign: 'center', color: searchError ? 'var(--danger)' : 'var(--fg-muted)', fontSize: 13 }}>
                    {searching ? 'Buscando…' : searchError ? 'Não foi possível buscar agora. Tente de novo.' : 'Nenhum produto encontrado.'}
                  </div>
                ) : (
                  <div className="pos-products">
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
                          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.015em', color: 'var(--fg)' }}>{brl(priceOf(p))}</span>
                          <span style={{ fontSize: 10.5, color: stockFor(p) < 25 ? 'var(--warning)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{stockFor(p)} un</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: cart + payment */}
            <div ref={cartRef} className="pos-cart" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-elev)', minWidth: 0, minHeight: 0 }}>
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

              <div className="no-bars" data-pos-scroll style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
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
                          {short ? `só ${stockFor(l.product)} em estoque` : brl(priceOf(l.product))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => bump(i, -1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>−</button>
                        <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{l.qty}</span>
                        <button onClick={() => bump(i, 1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>+</button>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: 74, textAlign: 'right' }}>{brl(l.qty * priceOf(l.product))}</span>
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
                    <button key={m.id} onClick={() => setPayment(m.id)} style={{
                      height: 44, fontSize: 12.5, fontWeight: 500,
                      border: '1px solid ' + (payment === m.id ? 'var(--accent)' : 'var(--line)'),
                      background: payment === m.id ? 'var(--accent-soft)' : 'var(--bg)',
                      color: payment === m.id ? 'var(--accent-text)' : 'var(--fg)',
                      borderRadius: 8,
                    }}>{m.short}</button>
                  ))}
                </div>
                {needsCashSession && (
                  <div style={{ fontSize: 11.5, color: 'var(--danger)', marginBottom: 4 }}>Abra o caixa antes de vender em dinheiro.</div>
                )}
                <div style={{ fontSize: 10.5, color: 'var(--fg-muted)' }}>Registra como o cliente pagou — o dinheiro passa pela maquininha ou PIX da loja.</div>
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

      <div className="pos-jump">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{cart.length} {cart.length === 1 ? 'item' : 'itens'} · {units} un</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{brl(net)}</div>
        </div>
        <button onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary" style={{ height: 44 }}>
          Ver carrinho
        </button>
      </div>
    </div>
  );
}
