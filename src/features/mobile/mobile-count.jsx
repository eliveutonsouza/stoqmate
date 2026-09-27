"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { PhoneFrame } from '@/features/mobile/phone-frame';
import { PHONE_W } from '@/features/mobile/phone-w';
import { PHONE_SCALE } from '@/features/mobile/phone-scale';
import { ProductThumb } from '@/components/ui/product-thumb';
import { ProductPicker } from '@/components/ui/product-picker';
import { variantLabel } from '@/lib/attr-colors';
import { I } from '@/components/icons';
import { useDefaultStoreId } from '@/components/layout/shell-context';
import { stockCountSubmitAction } from '@/features/stock/actions';

export function MobileCount({ stores, locations }) {
  const navigate = useNavigate();
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const storeLocations = locations.filter((l) => l.store_id === storeId);
  const [locationId, setLocationId] = React.useState(storeLocations[0]?.id ?? '');
  const [step, setStep] = React.useState('scan');
  const [rows, setRows] = React.useState([]);
  const [active, setActive] = React.useState(null);
  const [count, setCount] = React.useState(0);
  const [error, setError] = React.useState('');
  // Justificativa de quem contou: o banco exige 20+ caracteres se houver
  // divergência. A contagem é cega, então só se sabe depois de enviar.
  const [note, setNote] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const systemQty = (r) => (r.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
  const restart = () => { setRows([]); setActive(null); setCount(0); setError(''); setNote(''); setStep('scan'); };

  const bump = (d) => setCount((c) => Math.max(0, c + d));
  const commit = () => {
    // Bipar de novo o mesmo produto substitui a contagem anterior.
    setRows((r) => [{ ...active, real: count }, ...r.filter((x) => x.id !== active.id)]);
    setActive(null);
    setCount(0);
    setStep('scan');
  };

  const finish = () => {
    setError('');
    if (rows.length === 0) { setError('Conte pelo menos um item.'); return; }
    startTransition(async () => {
      const result = await stockCountSubmitAction({
        storeId, locationId: locationId || null, categoryId: null,
        items: rows.map((r) => ({ productId: r.id, countedQty: r.real })),
        reason: 'Contagem via mobile', justification: note.trim(),
      });
      if (result?.error) { setError(result.error); return; }
      setStep('done');
    });
  };

  return (
    <div className="phone-page" style={{ minHeight: '100vh', background: '#E7E4DD' }}>
      <div style={{ maxWidth: PHONE_W * PHONE_SCALE + 40, margin: '0 auto' }}>
        <div className="phone-page-head" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', color: '#16140F' }}>Conferência no celular</div>
            <div style={{ fontSize: 12.5, color: '#5C574F', marginTop: 3 }}>Contagem cega — o saldo do sistema só aparece no fechamento.</div>
          </div>
          <button onClick={() => navigate('/stock/count')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: '#fff', color: '#16140F', border: '1px solid #C9C4BA', cursor: 'pointer' }}>Versão desktop</button>
          <button onClick={() => navigate('/stock')} style={{ height: 26, padding: '0 9px', borderRadius: 5, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: 'transparent', color: '#5C574F', border: '1px solid transparent', cursor: 'pointer' }}>Sair</button>
        </div>

        <div className="phone-page-head" style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setLocationId(''); }} style={{ height: 34, borderRadius: 8, border: '1px solid #C9C4BA', padding: '0 10px', fontSize: 12.5 }}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={{ height: 34, borderRadius: 8, border: '1px solid #C9C4BA', padding: '0 10px', fontSize: 12.5 }}>
            <option value="">Sem local específico</option>
            {storeLocations.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="phone-bleed-item">
            <PhoneFrame>
              {step === 'scan' && (
                <div style={{ padding: 'var(--phone-pad, 64px 18px 48px)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(246,243,236,0.6)' }}>{rows.length} contados</span>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 10 }}>
                    <ProductPicker product={null} onSelect={(p) => { setActive(p); setCount(0); setStep('count'); }} />
                  </div>
                  <div style={{ flex: 1 }}></div>
                  {rows.length > 0 && (
                    <button onClick={() => setStep('list')} style={{ height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit', marginBottom: 8 }}>
                      Ver o que já contei ({rows.length})
                    </button>
                  )}
                </div>
              )}

              {step === 'count' && active && (
                <div style={{ padding: 'var(--phone-pad, 64px 18px 48px)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12, borderRadius: 12, marginBottom: 18, background: 'rgba(255,255,255,0.07)' }}>
                    <ProductThumb category={active.category} brand={active.brand} attrs={active.attrs} size={38} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{active.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.65)', marginTop: 2 }}>{variantLabel(active.attrs || {})}</div>
                      <div style={{ fontSize: 10, color: 'rgba(246,243,236,0.45)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{active.sku}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantas unidades você contou?</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 16 }}>
                    <button onClick={() => bump(-1)} style={{ width: 56, height: 56, borderRadius: 16, fontSize: 26, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F6F3EC', fontFamily: 'inherit' }}>−</button>
                    <div style={{ minWidth: 96, textAlign: 'center', fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                    <button onClick={() => bump(1)} style={{ width: 56, height: 56, borderRadius: 16, fontSize: 26, border: 'none', background: '#C43F14', color: '#fff', fontFamily: 'inherit' }}>+</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                    {[5, 10, 12, 24].map(n => (
                      <button key={n} onClick={() => setCount((c) => c + n)} style={{ height: 44, borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: '#F6F3EC' }}>+{n}</button>
                    ))}
                  </div>

                  <div style={{ flex: 1 }}></div>
                  <button onClick={commit} style={{ height: 52, borderRadius: 12, border: 'none', background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', marginBottom: 8 }}>Confirmar e bipar próximo</button>
                  <button onClick={() => { setActive(null); setStep('scan'); }} style={{ height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit' }}>Cancelar</button>
                </div>
              )}

              {step === 'list' && (
                <div style={{ padding: 'var(--phone-pad, 64px 18px 48px)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                  <div style={{ fontSize: 11, color: 'rgba(246,243,236,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Contados nesta sessão</div>
                  <div className="no-bars" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rows.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
                        <ProductThumb category={r.category} brand={r.brand} attrs={r.attrs} size={28} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                          <div style={{ fontSize: 10.5, color: 'rgba(246,243,236,0.6)' }}>{variantLabel(r.attrs || {})}</div>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.real}</span>
                        <span style={{ color: '#4ADE80', display: 'flex' }}><I.Check size={14} stroke={2.4} /></span>
                      </div>
                    ))}
                  </div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2}
                    aria-label="Observação da contagem"
                    placeholder="Observação (obrigatória se houver diferença): ex. caixa aberta no fundo da prateleira."
                    style={{ marginTop: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#F6F3EC', fontSize: 12, fontFamily: 'inherit', padding: '8px 10px', resize: 'none' }} />
                  {error && <div role="alert" style={{ fontSize: 11, color: '#FF8A8A', marginTop: 10 }}>{error}</div>}
                  <button onClick={finish} disabled={pending} style={{ height: 52, borderRadius: 12, border: 'none', background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', marginTop: 14, marginBottom: 8, opacity: pending ? 0.6 : 1 }}>
                    {pending ? 'Enviando…' : 'Fechar contagem'}
                  </button>
                  <button onClick={() => setStep('scan')} style={{ height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit' }}>Continuar contando</button>
                </div>
              )}
              {step === 'done' && (
                <div style={{ padding: 'var(--phone-pad, 64px 18px 48px)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', color: '#F6F3EC' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Contagem fechada</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(246,243,236,0.6)', marginBottom: 12 }}>Cada divergência foi lançada no histórico como contagem.</div>
                  <div className="no-bars" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rows.map((r) => {
                      const diff = r.real - systemQty(r);
                      return (
                        <div key={r.id} style={{ padding: '10px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                          <div style={{ display: 'flex', gap: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(246,243,236,0.7)', marginTop: 3 }}>
                            <span>sistema {systemQty(r)}</span>
                            <span>contado {r.real}</span>
                            <span style={{ marginLeft: 'auto', color: diff === 0 ? '#4ADE80' : '#FF8A8A' }}>{diff === 0 ? 'OK' : diff > 0 ? `+${diff}` : diff}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => navigate('/stock/history?kind=count')} style={{ height: 52, borderRadius: 12, border: 'none', background: '#C43F14', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', marginTop: 14, marginBottom: 8 }}>Ver no histórico</button>
                  <button onClick={restart} style={{ height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F6F3EC', fontSize: 14, fontFamily: 'inherit' }}>Nova contagem</button>
                </div>
              )}
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
