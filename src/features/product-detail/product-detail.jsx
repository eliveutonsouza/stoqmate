"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { variantLabel } from '@/lib/attr-colors';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { Modal } from '@/components/ui/modal';

export function ProductDetail({ detail }) {
  const navigate = useNavigate();
  const { product: p, stockByStore, currentStock, siblings, movements } = detail;
  const c = p.category;
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const margin = p.sale_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0;

  const variantAttrs = c.category_attributes ?? [];
  const variantAttr = variantAttrs[variantAttrs.length - 1];
  const maxSiblingQty = Math.max(1, ...siblings.map((s) => s.stock));
  const maxStoreQty = Math.max(1, ...stockByStore.map((s) => s.qty));
  const networkTotal = stockByStore.reduce((s, b) => s + b.qty, 0);

  return (
    <StoreShell route="/products/detail" breadcrumb={['Catálogo', p.sku]} navigate={navigate}>
      <PageHeader
        title={p.name}
        sub={`${p.brand} · ${variantLabel(p.attrs)} · SKU ${p.sku}`}
        actions={(
          <>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm"><I.Plus size={13} /> Entrada</button>
            <button onClick={() => navigate(`/products/edit?id=${p.id}`)} className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm">Vender</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.photo_url ? (
              <div onClick={() => setPhotoOpen(true)} style={{ height: 240, cursor: 'zoom-in', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div className="card placeholder-stripes" style={{ height: 240, borderRadius: 8 }}>sem foto</div>
            )}
            <div className="card" style={{ overflow: 'hidden' }}>
              {[
                ['SKU', p.sku, true],
                ['Código de barras', p.barcode || '—', true],
                ['Categoria', c.name],
                ['Marca', p.brand],
                ...variantAttrs.map((a) => [a.label, p.attrs[a.key] || '—']),
                ['Unidade', c.unit],
                ['Local', p.default_location?.code || '—', true],
                ['Fornecedor', p.supplier?.name || '—'],
                ['Cadastrado em', new Date(p.created_at).toLocaleDateString('pt-BR')],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Nesta unidade', v: `${currentStock}`, s: `${c.unit_plural} · mín. ${p.min_stock}` },
                { l: 'Preço de compra', v: brl(p.cost_price), s: 'atual' },
                { l: 'Preço de venda', v: brl(p.sale_price), s: 'sem promoção ativa' },
                { l: 'Margem', v: margin.toFixed(1) + '%', s: brl(p.sale_price - p.cost_price) + ' por unidade', tone: margin > 0 ? 'success' : 'danger' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'success' ? 'var(--success)' : m.tone === 'danger' ? 'var(--danger)' : 'var(--fg)' }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Outras variações</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                    {siblings.length <= 1 ? 'Nenhuma outra variação de ' + p.name + '.' : `${p.brand} ${p.name} · ${variantAttr?.label.toLowerCase() ?? 'variação'}.`}
                  </p>
                </div>
                {siblings.length <= 1 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Este é o único SKU deste produto.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                    {siblings.map((s) => {
                      const label = variantAttr ? (s.attrs?.[variantAttr.key] || s.sku) : s.sku;
                      const isSelf = s.id === p.id;
                      return (
                        <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: s.stock === 0 ? 'var(--danger)' : 'var(--fg-muted)' }}>{s.stock}</span>
                          <div style={{
                            width: '100%',
                            height: `${Math.max((s.stock / maxSiblingQty) * 100, 3)}%`,
                            background: s.stock === 0 ? 'var(--danger-soft)' : isSelf ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 28%, transparent)',
                            borderRadius: '3px 3px 0 0',
                            border: s.stock === 0 ? '1px dashed var(--danger)' : 'none',
                          }}></div>
                          <span style={{
                            fontSize: 10, fontFamily: 'var(--font-mono)',
                            color: isSelf ? 'var(--fg)' : 'var(--fg-muted)',
                            fontWeight: isSelf ? 600 : 400,
                          }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saldo deste SKU na rede</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{networkTotal} unidades em {stockByStore.length} {stockByStore.length === 1 ? 'local' : 'locais'}.</p>
                  </div>
                  <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm"><I.Swap size={12} /> Transferir</button>
                </div>
                {stockByStore.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Sem saldo registrado em nenhuma unidade.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {stockByStore.map((s) => (
                      <div key={s.store_id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: s.current ? 500 : 400 }}>
                            {s.store?.name}{s.current && <span className="badge badge-accent" style={{ marginLeft: 7 }}>atual</span>}
                          </span>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{s.qty} un</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                          <div style={{ width: `${(s.qty / maxStoreQty) * 100}%`, height: '100%', background: s.current ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Movimentações deste SKU</h3>
                <button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">Histórico completo <I.ChevronRight size={12} /></button>
              </div>
              {movements.length === 0 ? (
                <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma movimentação registrada para este SKU ainda.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Data</th><th>Tipo</th><th className="num">Qtd</th><th className="num">Valor</th><th>Por</th></tr>
                  </thead>
                  <tbody>
                    {movements.map((h) => {
                      const t = MOVEMENT_TYPES[h.kind];
                      return (
                        <tr key={h.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                            {new Date(h.created_at).toLocaleDateString('pt-BR')} {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td><span style={{ padding: '2px 7px', borderRadius: 4, background: t.soft, color: t.color, fontSize: 11, fontWeight: 500 }}>{t.label}</span></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: h.qty > 0 ? 'var(--success)' : 'var(--fg)' }}>{h.qty > 0 ? '+' : ''}{h.qty}</td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.unit_price ? brl(h.unit_price * Math.abs(h.qty)) : '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{h.byName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Page>

      <Modal open={photoOpen} onClose={() => setPhotoOpen(false)} title={p.sku} desc={`${p.brand} ${p.name} · ${variantLabel(p.attrs)}`} width={560}
        footer={<button className="btn btn-outline" onClick={() => setPhotoOpen(false)}>Fechar</button>}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
      </Modal>
    </StoreShell>
  );
}
