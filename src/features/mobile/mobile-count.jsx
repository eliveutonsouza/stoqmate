"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { PhoneFrame } from '@/features/mobile/phone-frame';
import { PHONE_W } from '@/features/mobile/phone-w';
import { PHONE_SCALE } from '@/features/mobile/phone-scale';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { I } from '@/components/icons';

export function MobileCount() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState('scan');
  const [rows, setRows] = React.useState([
    { sku: 'ELE-FONE-PR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' }, real: 40 },
    { sku: 'ELE-CARR-PR-65W', cat: 'eletronicos', name: 'Carregador GaN 65W', attrs: { cor: 'Preto' }, real: 66 },
    { sku: 'ELE-FONE-BR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Branco', capacidade: '128 GB' }, real: 28 },
  ]);
  const [active, setActive] = React.useState({
    sku: 'ELE-FONE-PR-256', cat: 'eletronicos', name: 'Fone Bluetooth ANC',
    attrs: { cor: 'Preto', capacidade: '256 GB' }, count: 24,
  });

  const total = rows.length;
  const target = 62;

  const bump = (d) => setActive(a => ({ ...a, count: Math.max(0, a.count + d) }));
  const commit = () => {
    setRows(r => [{ ...active, real: active.count }, ...r]);
    setActive({ sku: 'ELE-FONE-PR-64', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '64 GB' }, count: 0 });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E7E4DD', padding: '24px 20px 40px' }}>
      {/* Three scaled frames need 3×306 + 2×18 = 954px; give the row room or it wraps. */}
      <div style={{ maxWidth: 976, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', color: '#16140F' }}>Conferência no celular</div>
            <div style={{ fontSize: 12.5, color: '#5C574F', marginTop: 3 }}>
              Contagem física acontece em pé, no corredor. Uma mão segura o aparelho, a outra conta —
              por isso toque grande, sem teclado, e o esperado fica oculto.
            </div>
          </div>
          <button onClick={() => navigate('/stock/count')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#16140F', border: '1px solid #C9C4BA', cursor: 'pointer' }}>Versão desktop</button>
          <button onClick={() => navigate('/stock')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: 'transparent', color: '#5C574F', border: '1px solid transparent', cursor: 'pointer' }}>Sair</button>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* 1 — scan */}
          <div>
            <PhoneFrame>
              <div style={{ padding: '64px 18px 48px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 5,
                    background: 'rgba(255,255,255,0.12)', color: '#F6F3EC',
                  }}>A-04</span>
                  <span style={{ fontSize: 11, color: 'rgba(246,243,236,0.6)' }}>INV-07</span>
                  <div style={{ flex: 1 }}></div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(246,243,236,0.6)' }}>{total}/{target}</span>
                </div>

                <div style={{ height: 4, background: 'rgba(255,255,255,0.14)', borderRadius: 2, marginBottom: 18 }}>
                  <div style={{ width: `${(total / target) * 100}%`, height: '100%', background: '#FF8A5C', borderRadius: 2 }}></div>
                </div>

                {/* camera viewfinder */}
                <div style={{
                  aspectRatio: '1 / 1', borderRadius: 14, position: 'relative',
                  background: 'linear-gradient(160deg, #2a2720 0%, #141310 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: 16,
                }}>
                  {[[0,0],[1,0],[0,1],[1,1]].map(([x, y], i) => (
                    <div key={i} style={{
                      position: 'absolute', width: 34, height: 34,
                      [x ? 'right' : 'left']: 22, [y ? 'bottom' : 'top']: 22,
                      [x ? 'borderRight' : 'borderLeft']: '3px solid #FF8A5C',
                      [y ? 'borderBottom' : 'borderTop']: '3px solid #FF8A5C',
                      borderRadius: x === y ? (x ? '0 0 6px 0' : '6px 0 0 0') : (x ? '0 6px 0 0' : '0 0 0 6px'),
                    }}></div>
                  ))}
                  <div style={{ display: 'flex', gap: 2, height: 54, alignItems: 'center' }}>
                    {[3,1,2,1,4,1,2,3,1,1,3,2,1,4,1,2,1,3,1,2].map((w, i) => (
                      <div key={i} style={{ width: w, height: '100%', background: i % 2 ? 'transparent' : 'rgba(246,243,236,0.92)' }}></div>
                    ))}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '10px 14px', background: 'rgba(0,0,0,0.5)',
                    fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'center',
                    color: 'rgba(246,243,236,0.85)',
                  }}>aponte para o código de barras</div>
                </div>

                <div style={{ flex: 1 }}></div>

                <button onClick={() => setStep('count')} style={{
                  height: 52, borderRadius: 12, border: 'none',
                  background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', marginBottom: 8,
                }}>Bipar produto</button>
                <button style={{
                  height: 46, borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit',
                }}>Buscar sem código</button>
              </div>
            </PhoneFrame>
            <div style={{ width: PHONE_W * PHONE_SCALE, textAlign: 'center', fontSize: 12, color: '#5C574F', marginTop: 12, lineHeight: 1.5 }}>
              <strong style={{ color: '#16140F', fontWeight: 600 }}>1 · Bipar</strong><br/>
              Progresso do local sempre visível
            </div>
          </div>

          {/* 2 — count */}
          <div>
            <PhoneFrame>
              <div style={{ padding: '64px 18px 48px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: 12, borderRadius: 12, marginBottom: 18,
                  background: 'rgba(255,255,255,0.07)',
                }}>
                  <ProductThumb cat={active.cat} attrs={active.attrs} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{active.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.65)', marginTop: 2 }}>{variantLabel(active.attrs)}</div>
                    <div style={{ fontSize: 10, color: 'rgba(246,243,236,0.45)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{active.sku}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quantas unidades você contou?
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 16 }}>
                  <button onClick={() => bump(-1)} style={{
                    width: 56, height: 56, borderRadius: 16, fontSize: 26,
                    border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                    color: '#F6F3EC', fontFamily: 'inherit',
                  }}>−</button>
                  <div style={{
                    minWidth: 96, textAlign: 'center',
                    fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
                  }}>{active.count}</div>
                  <button onClick={() => bump(1)} style={{
                    width: 56, height: 56, borderRadius: 16, fontSize: 26,
                    border: 'none', background: '#C43F14', color: '#fff', fontFamily: 'inherit',
                  }}>+</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                  {[5, 10, 12, 24].map(n => (
                    <button key={n} onClick={() => setActive(a => ({ ...a, count: a.count + n }))} style={{
                      height: 44, borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)',
                      color: '#F6F3EC',
                    }}>+{n}</button>
                  ))}
                </div>

                <div style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 14,
                  background: 'rgba(255,255,255,0.05)', fontSize: 11,
                  color: 'rgba(246,243,236,0.6)', lineHeight: 1.5,
                }}>
                  Contagem cega — o saldo do sistema só aparece no fechamento, para não enviesar quem conta.
                </div>

                <div style={{ flex: 1 }}></div>

                <button onClick={commit} style={{
                  height: 52, borderRadius: 12, border: 'none',
                  background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', marginBottom: 8,
                }}>Confirmar e bipar próximo</button>
                <button onClick={() => setStep('list')} style={{
                  height: 46, borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit',
                }}>Ver o que já contei</button>
              </div>
            </PhoneFrame>
            <div style={{ width: PHONE_W * PHONE_SCALE, textAlign: 'center', fontSize: 12, color: '#5C574F', marginTop: 12, lineHeight: 1.5 }}>
              <strong style={{ color: '#16140F', fontWeight: 600 }}>2 · Contar</strong><br/>
              Sem teclado: ± e atalhos de caixa fechada
            </div>
          </div>

          {/* 3 — session list / close */}
          <div>
            <PhoneFrame>
              <div style={{ padding: '64px 18px 48px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', fontFamily: 'var(--font-mono)' }}>{total}</span>
                  <span style={{ fontSize: 13, color: 'rgba(246,243,236,0.6)' }}>de {target} SKUs</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.14)', borderRadius: 2, marginBottom: 16 }}>
                  <div style={{ width: `${(total / target) * 100}%`, height: '100%', background: '#FF8A5C', borderRadius: 2 }}></div>
                </div>

                <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Contados neste local
                </div>

                <div className="no-bars" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rows.map(r => (
                    <div key={r.sku} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 11px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                    }}>
                      <ProductThumb cat={r.cat} attrs={r.attrs} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 10.5, color: 'rgba(246,243,236,0.6)' }}>{variantLabel(r.attrs)}</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.real}</span>
                      <span style={{ color: '#4ADE80', display: 'flex' }}><I.Check size={14} stroke={2.4} /></span>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '10px 12px', borderRadius: 10, margin: '14px 0',
                  background: 'rgba(251,191,36,0.14)', fontSize: 11,
                  color: '#FBBF24', lineHeight: 1.5,
                }}>
                  Faltam {target - total} SKUs deste local. Você pode fechar parcialmente — o resto fica pendente.
                </div>

                <button onClick={() => navigate('/stock/count')} style={{
                  height: 52, borderRadius: 12, border: 'none',
                  background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', marginBottom: 8,
                }}>Fechar e ver divergências</button>
                <button onClick={() => setStep('scan')} style={{
                  height: 46, borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit',
                }}>Continuar contando</button>
              </div>
            </PhoneFrame>
            <div style={{ width: PHONE_W * PHONE_SCALE, textAlign: 'center', fontSize: 12, color: '#5C574F', marginTop: 12, lineHeight: 1.5 }}>
              <strong style={{ color: '#16140F', fontWeight: 600 }}>3 · Fechar</strong><br/>
              Fecha parcial; divergências vão ao desktop
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28, padding: 18, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #D5D0C5', borderRadius: 8 }}>
          <span style={{ color: '#5C574F', flexShrink: 0 }}><I.QR size={17} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: '#16140F' }}>Sem app para instalar</div>
            <div style={{ fontSize: 12.5, color: '#5C574F', marginTop: 3, lineHeight: 1.5 }}>
              Abre no navegador do celular a partir de um QR na tela de contagem do desktop. A sessão é a mesma —
              quem conta no corredor e quem fecha no escritório veem os mesmos números.
            </div>
          </div>
          <button onClick={() => navigate('/stock/count')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#16140F', border: '1px solid #C9C4BA', cursor: 'pointer' }}>Abrir sessão no desktop</button>
        </div>
      </div>
    </div>
  );
}
