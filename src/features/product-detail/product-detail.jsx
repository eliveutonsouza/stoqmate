"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { DEMO_PRODUCT } from '@/features/product-detail/demo-product';
import { catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { variantLabel } from '@/lib/attr-colors';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { Modal } from '@/components/ui/modal';

export function ProductDetail() {
  const navigate = useNavigate();
  const p = DEMO_PRODUCT;
  const c = catById(p.cat);
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const margin = ((p.sale - p.purchase) / p.sale) * 100;

  // Sibling SKUs: same product, other values of the last attribute in the schema
  const variantAttr = c.attributes[c.attributes.length - 1];
  const byVariant = [
    { v: '64 GB', qty: 18 }, { v: '128 GB', qty: 42 }, { v: '256 GB', qty: 26 },
    { v: '512 GB', qty: 11 }, { v: '1 TB', qty: 0 },
  ];
  const maxQty = Math.max(...byVariant.map(s => s.qty));

  const byStore = [
    { name: 'Loja Centro', qty: 42, current: true },
    { name: 'Loja Shopping Norte', qty: 28 },
    { name: 'Loja Campinas', qty: 9 },
    { name: 'Centro de Distribuição', qty: 164 },
  ];
  const maxStore = Math.max(...byStore.map(s => s.qty));

  const history = [
    { date: '18/09 14:38', type: 'sale', qty: -1, value: 299.00, user: 'Lucas', ref: '#4286' },
    { date: '18/09 09:05', type: 'entry', qty: 48, value: 7560.00, user: 'Ana', ref: 'NF 8421' },
    { date: '16/09 16:02', type: 'transfer', qty: -12, value: 0, user: 'Ana', ref: 'TRF-118' },
    { date: '14/09 11:20', type: 'sale', qty: -3, value: 897.00, user: 'Marina', ref: '#4241' },
    { date: '12/09 18:14', type: 'adjustment', qty: -2, value: 0, user: 'Ana', ref: 'INV-05' },
    { date: '09/09 15:48', type: 'return', qty: 1, value: 299.00, user: 'Lucas', ref: '#4198' },
  ];

  return (
    <StoreShell route="/products/detail" breadcrumb={['Catálogo', p.sku]} navigate={navigate}>
      <PageHeader
        title={p.name}
        sub={`${p.brand} · ${variantLabel(p.attrs)} · SKU ${p.sku}`}
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.QR size={13} /> Etiqueta</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm"><I.Plus size={13} /> Entrada</button>
            <button onClick={() => navigate('/products/edit')} className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm">Vender</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => setPhotoOpen(true)} className="card placeholder-stripes" style={{ height: 240, cursor: 'zoom-in', borderRadius: 8 }}>
              foto do produto
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {[
                ['SKU', p.sku, true],
                ['Código de barras', p.barcode, true],
                ['Categoria', c.name],
                ['Marca', p.brand],
                ...c.attributes.map(a => [a.label, p.attrs[a.key] || '—']),
                ['Unidade', c.unit],
                ['Local', p.loc, true],
                ['Fornecedor', p.supplier],
                ['Atualizado', p.updated],
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
                { l: 'Nesta unidade', v: `${p.stock}`, s: `${c.unitPlural} · mín. ${p.min}` },
                { l: 'Preço de compra', v: brl(p.purchase), s: 'última nota' },
                { l: 'Preço de venda', v: brl(p.sale), s: 'sem promoção ativa' },
                { l: 'Margem', v: margin.toFixed(1) + '%', s: brl(p.sale - p.purchase) + ' por unidade', tone: 'success' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'success' ? 'var(--success)' : 'var(--fg)' }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Estoque por {variantAttr.label.toLowerCase()}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Variações de {p.name} na cor {p.attrs.cor}.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                  {byVariant.map(s => (
                    <div key={s.v} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: s.qty === 0 ? 'var(--danger)' : 'var(--fg-muted)' }}>{s.qty}</span>
                      <div style={{
                        width: '100%',
                        height: `${Math.max((s.qty / maxQty) * 100, 3)}%`,
                        background: s.qty === 0 ? 'var(--danger-soft)' : s.v === p.attrs[variantAttr.key] ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 28%, transparent)',
                        borderRadius: '3px 3px 0 0',
                        border: s.qty === 0 ? '1px dashed var(--danger)' : 'none',
                      }}></div>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        color: s.v === p.attrs[variantAttr.key] ? 'var(--fg)' : 'var(--fg-muted)',
                        fontWeight: s.v === p.attrs[variantAttr.key] ? 600 : 400,
                      }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saldo deste SKU na rede</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>243 unidades em 4 locais.</p>
                  </div>
                  <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm"><I.Swap size={12} /> Transferir</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {byStore.map(s => (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: s.current ? 500 : 400 }}>
                          {s.name}{s.current && <span className="badge badge-accent" style={{ marginLeft: 7 }}>atual</span>}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{s.qty} un</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                        <div style={{ width: `${(s.qty / maxStore) * 100}%`, height: '100%', background: s.current ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Movimentações deste SKU</h3>
                <button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">Histórico completo <I.ChevronRight size={12} /></button>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Tipo</th><th>Ref.</th><th className="num">Qtd</th><th className="num">Valor</th><th>Por</th></tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const t = MOVEMENT_TYPES[h.type];
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{h.date}</td>
                        <td><span style={{ padding: '2px 7px', borderRadius: 4, background: t.soft, color: t.color, fontSize: 11, fontWeight: 500 }}>{t.label}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{h.ref}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: h.qty > 0 ? 'var(--success)' : 'var(--fg)' }}>{h.qty > 0 ? '+' : ''}{h.qty}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.value ? brl(h.value) : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{h.user}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Page>

      <Modal open={photoOpen} onClose={() => setPhotoOpen(false)} title={p.sku} desc={`${p.brand} ${p.name} · ${variantLabel(p.attrs)}`} width={560}
        footer={<><button className="btn btn-outline" onClick={() => setPhotoOpen(false)}>Fechar</button><button className="btn btn-primary">Substituir foto</button></>}>
        <div className="placeholder-stripes" style={{ height: 380, borderRadius: 8, border: '1px solid var(--line)' }}>foto em tamanho real</div>
      </Modal>
    </StoreShell>
  );
}

// === Product form: the attribute fields come from the chosen category ===
