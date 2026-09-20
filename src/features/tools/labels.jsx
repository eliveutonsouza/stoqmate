"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { CATALOG } from '@/lib/catalog';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { TextInput } from '@/components/ui/text-input';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';

export function Labels() {
  const navigate = useNavigate();
  const [template, setTemplate] = React.useState('shelf');
  const [fields, setFields] = React.useState({ name: true, sku: true, barcode: true, price: true, variant: true, location: false });
  const toggle = (k) => setFields(f => ({ ...f, [k]: !f[k] }));

  const templates = [
    { k: 'shelf', t: 'Etiqueta de prateleira', d: '70 × 40 mm · 21 por folha A4', w: 150, h: 86 },
    { k: 'product', t: 'Etiqueta de produto', d: '50 × 25 mm · 40 por folha A4', w: 132, h: 66 },
    { k: 'price', t: 'Cartaz de preço', d: '100 × 70 mm · 8 por folha A4', w: 150, h: 106 },
    { k: 'barcode', t: 'Só código de barras', d: '38 × 20 mm · 65 por folha A4', w: 120, h: 58 },
  ];
  const tpl = templates.find(t => t.k === template);

  return (
    <StoreShell route="/labels" breadcrumb={['Etiquetas']} navigate={navigate}>
      <PageHeader
        title="Etiquetas e cartazes"
        sub="Gere folhas A4 para prateleira, produto ou preço promocional"
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Pré-visualizar folha</button>
            <button className="btn btn-primary btn-sm"><I.Download size={13} /> Gerar PDF (3 folhas)</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Modelo" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {templates.map(t => {
                  const on = template === t.k;
                  return (
                    <button key={t.k} onClick={() => setTemplate(t.k)} style={{
                      display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
                      padding: '11px 13px',
                      border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                      background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      borderRadius: 7,
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'),
                        background: on ? 'var(--accent-strong)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}>{on && <I.Check size={9} stroke={3} />}</span>
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{t.t}</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{t.d}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormCard>

            <FormCard title="O que imprimir na etiqueta" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  ['name', 'Nome do produto'], ['sku', 'SKU'], ['barcode', 'Código de barras'],
                  ['price', 'Preço de venda'], ['variant', 'Atributos da variação'], ['location', 'Local de estoque'],
                ].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={fields[k]} onChange={() => toggle(k)} /> {l}
                  </label>
                ))}
              </div>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Itens na fila de impressão</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Adicione do catálogo, de um local ou de uma promoção.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm">Do local A-04</button>
                  <button onClick={() => navigate('/products')} className="btn btn-outline btn-sm"><I.Plus size={12} /> Do catálogo</button>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Produto</th><th>SKU</th><th>Variação</th><th className="num">Preço</th><th style={{ width: 90 }}>Cópias</th><th style={{ width: 30 }}></th></tr>
                </thead>
                <tbody>
                  {CATALOG.slice(0, 6).map((p, i) => (
                    <tr key={p.sku}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb cat={p.cat} attrs={p.attrs} size={26} />
                          <span style={{ fontSize: 13 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                      <td><AttrChip value={variantLabel(p.attrs)} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.sale)}</td>
                      <td><TextInput mono type="number" defaultValue={i === 0 ? 4 : 1} style={{ height: 28 }} /></td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                6 SKUs · 9 etiquetas · 1 folha A4
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Pré-visualização</div>
              <div style={{
                width: tpl.w, height: tpl.h, margin: '0 auto',
                border: '1px solid var(--line-strong)', borderRadius: 4,
                background: '#fff', color: '#16140F',
                padding: 10, display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {fields.name && <div style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>Fone Bluetooth ANC</div>}
                {fields.variant && <div style={{ fontSize: 8, color: '#5C574F' }}>Preto · 128 GB</div>}
                {fields.sku && <div style={{ fontSize: 7, fontFamily: 'var(--font-mono)', color: '#5C574F' }}>ELE-FONE-PR-128</div>}
                <div style={{ flex: 1 }}></div>
                {fields.price && (
                  <div style={{ fontSize: template === 'price' ? 22 : 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>R$ 299,00</div>
                )}
                {fields.location && <div style={{ fontSize: 7, fontFamily: 'var(--font-mono)', color: '#5C574F' }}>A-04</div>}
                {fields.barcode && (
                  <div style={{ display: 'flex', gap: 1, height: 16, alignItems: 'flex-end', marginTop: 2 }}>
                    {[2,1,1,3,1,2,1,1,2,3,1,1,2,1,3,1,2,1,1,2,3,1,2,1,1,3,1,2].map((w, i) => (
                      <div key={i} style={{ width: w, height: '100%', background: i % 2 ? 'transparent' : '#16140F' }}></div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
                {tpl.d}
              </div>
            </div>

            <FormCard title="Impressão" cols={1}>
              <Field label="Tamanho do papel">
                <SelectInput value="A4" onChange={() => {}} options={['A4', 'Carta', 'Bobina 80 mm (térmica)']} />
              </Field>
              <Field label="Começar na etiqueta" hint="Para reaproveitar folhas já usadas.">
                <TextInput mono defaultValue="1" />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" defaultChecked /> Imprimir marcas de corte
              </label>
            </FormCard>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /exports ===
