"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { POS_SUGGEST } from '@/features/stock/pos-suggest';
import { I } from '@/components/icons';
import { MOCK } from '@/lib/mock';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';

export function TabletPOS() {
  const navigate = useNavigate();
  const grid = [
    ...POS_SUGGEST,
    { sku: 'CAS-TOAL-BE-ALG', cat: 'casa', brand: 'Casa Viva', name: 'Jogo de Toalhas', attrs: { cor: 'Bege', material: 'Algodão' }, stock: 64, sale: 190.00, purchase: 117.8 },
    { sku: 'VES-MOLE-CZ-G', cat: 'vestuario', brand: 'Malharia Sul', name: 'Moletom Flanelado', attrs: { cor: 'Cinza', tamanho: 'G' }, stock: 76, sale: 189.00, purchase: 105.8 },
    { sku: 'CAL-BOTA-MR-40', cat: 'calcados', brand: 'Terrano', name: 'Bota Couro Trilha', attrs: { cor: 'Marrom', numeracao: '40' }, stock: 22, sale: 459.00, purchase: 261.6 },
  ];

  const [cat, setCat] = React.useState('all');
  const [cart, setCart] = React.useState([{ ...POS_SUGGEST[0], qty: 1 }, { ...POS_SUGGEST[3], qty: 2 }]);
  const [pad, setPad] = React.useState('');

  const shown = cat === 'all' ? grid : grid.filter(p => p.cat === cat);
  const add = (p) => setCart(c => {
    const at = c.findIndex(l => l.sku === p.sku);
    return at >= 0 ? c.map((l, j) => (j === at ? { ...l, qty: l.qty + 1 } : l)) : [...c, { ...p, qty: 1 }];
  });
  const bump = (i, d) => setCart(c => c.map((l, j) => (j === i ? { ...l, qty: Math.max(0, l.qty + d) } : l)).filter(l => l.qty > 0));
  const total = cart.reduce((s, l) => s + l.qty * l.sale, 0);
  const units = cart.reduce((s, l) => s + l.qty, 0);

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
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.012em' }}>Loja Centro · balcão 01</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Lucas Prado · turno 14:00–22:00</div>
                </div>
                <div style={{ flex: 1 }}></div>
                <button onClick={() => navigate('/cash')} className="btn btn-outline" style={{ height: 40 }}>
                  <I.Credit size={15} /> Caixa
                </button>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
                    <I.QR size={17} />
                  </span>
                  <input className="input" placeholder="Bipe o produto ou toque abaixo"
                    style={{ paddingLeft: 42, height: 52, fontSize: 15 }} />
                </div>
                <div className="no-bars" style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                  {[{ id: 'all', name: 'Tudo', icon: 'Grid' }, ...MOCK.categories].map(c => {
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {shown.map(p => (
                    <button key={p.sku} onClick={() => add(p)} style={{
                      display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left',
                      padding: 12, minHeight: 128,
                      border: '1px solid var(--line)', background: 'var(--bg-elev)',
                      borderRadius: 10,
                    }}>
                      <ProductThumb cat={p.cat} attrs={p.attrs} size={34} />
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 10, lineHeight: 1.3, color: 'var(--fg)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 3 }}>{variantLabel(p.attrs)}</div>
                      <div style={{ flex: 1 }}></div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.015em', color: 'var(--fg)' }}>{brl(p.sale)}</span>
                        <span style={{ fontSize: 10.5, color: p.stock < 25 ? 'var(--warning)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{p.stock} un</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: cart + keypad */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-elev)', minWidth: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Atendimento #4287</div>
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
                ) : cart.map((l, i) => (
                  <div key={l.sku} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 10px', marginBottom: 6,
                    background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 9,
                  }}>
                    <ProductThumb cat={l.cat} attrs={l.attrs} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{l.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{brl(l.sale)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button onClick={() => bump(i, -1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>−</button>
                      <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{l.qty}</span>
                      <button onClick={() => bump(i, 1)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', fontSize: 16 }}>+</button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: 74, textAlign: 'right' }}>{brl(l.qty * l.sale)}</span>
                  </div>
                ))}
              </div>

              {/* Numeric keypad — quantity / discount / cash received */}
              <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Teclado</span>
                  <div style={{ flex: 1, height: 34, border: '1px solid var(--line-strong)', borderRadius: 7, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600 }}>
                    {pad || '0'}
                  </div>
                  <button onClick={() => setPad('')} className="btn btn-outline" style={{ height: 34 }}>C</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {['7','8','9','Qtd','4','5','6','%','1','2','3','R$','0','00',',','⌫'].map(k => {
                    const isAction = ['Qtd','%','R$','⌫'].includes(k);
                    return (
                      <button key={k} onClick={() => k === '⌫' ? setPad(p => p.slice(0, -1)) : isAction ? null : setPad(p => p + k)} style={{
                        height: 44, borderRadius: 8, fontSize: 15, fontWeight: 500,
                        border: '1px solid ' + (isAction ? 'var(--line)' : 'var(--line-strong)'),
                        background: isAction ? 'var(--bg-sunken)' : 'var(--bg)',
                        color: isAction ? 'var(--fg-muted)' : 'var(--fg)',
                        fontFamily: isAction ? 'inherit' : 'var(--font-mono)',
                      }}>{k}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: 14, borderTop: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total</span>
                  <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{brl(total)}</span>
                </div>
                <button onClick={() => navigate('/receipt')} className="btn btn-primary" disabled={!cart.length}
                  style={{ width: '100%', height: 56, justifyContent: 'center', fontSize: 15, opacity: cart.length ? 1 : 0.45 }}>
                  Cobrar e finalizar
                </button>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-outline" style={{ flex: 1, height: 44, justifyContent: 'center' }}>Desconto</button>
                  <button className="btn btn-outline" style={{ flex: 1, height: 44, justifyContent: 'center' }}>Cliente</button>
                  <button className="btn btn-outline" style={{ flex: 1, height: 44, justifyContent: 'center' }}>Reter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === /cash — cash session ===
