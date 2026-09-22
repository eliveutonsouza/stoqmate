"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { TextInput } from '@/components/ui/text-input';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { EmptyState } from '@/components/ui/empty-state';

const TEMPLATES = [
  { k: 'shelf', t: 'Etiqueta de prateleira', d: '70 × 40 mm', wmm: 70, hmm: 40 },
  { k: 'product', t: 'Etiqueta de produto', d: '50 × 25 mm', wmm: 50, hmm: 25 },
  { k: 'price', t: 'Cartaz de preço', d: '100 × 70 mm', wmm: 100, hmm: 70 },
  { k: 'barcode', t: 'Só código de barras', d: '38 × 20 mm', wmm: 38, hmm: 20 },
];

function LabelContent({ p, fields, template }) {
  return (
    <>
      {fields.name && <div style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>}
      {fields.variant && <div style={{ fontSize: 8, color: '#5C574F' }}>{variantLabel(p.attrs || {})}</div>}
      {fields.sku && <div style={{ fontSize: 7, fontFamily: 'monospace', color: '#5C574F' }}>{p.sku}</div>}
      <div style={{ flex: 1 }}></div>
      {fields.price && (
        <div style={{ fontSize: template === 'price' ? 22 : 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{brl(p.sale_price)}</div>
      )}
      {fields.barcode && p.barcode && (
        <div style={{ display: 'flex', gap: 1, height: 16, alignItems: 'flex-end', marginTop: 2 }}>
          {[2,1,1,3,1,2,1,1,2,3,1,1,2,1,3,1,2,1,1,2].map((w, i) => (
            <div key={i} style={{ width: w, height: '100%', background: i % 2 ? 'transparent' : '#16140F' }}></div>
          ))}
        </div>
      )}
    </>
  );
}

export function Labels() {
  const navigate = useNavigate();
  const [template, setTemplate] = React.useState('shelf');
  const [fields, setFields] = React.useState({ name: true, sku: true, barcode: true, price: true, variant: true });
  const toggle = (k) => setFields(f => ({ ...f, [k]: !f[k] }));
  const [queue, setQueue] = React.useState([]);

  const tpl = TEMPLATES.find(t => t.k === template);
  const totalLabels = queue.reduce((s, q) => s + q.copies, 0);

  const addProduct = (p) => setQueue((q) => {
    if (q.some((i) => i.product.id === p.id)) return q;
    return [...q, { product: p, copies: 1 }];
  });
  const setCopies = (id, v) => setQueue((q) => q.map((i) => (i.product.id === id ? { ...i, copies: Math.max(1, v) } : i)));
  const removeItem = (id) => setQueue((q) => q.filter((i) => i.product.id !== id));

  const printLabels = () => window.print();

  const printItems = queue.flatMap((i) => Array.from({ length: i.copies }, () => i.product));

  return (
    <StoreShell route="/labels" breadcrumb={['Etiquetas']} navigate={navigate}>
      <PageHeader
        title="Etiquetas e cartazes"
        sub="Monte a fila e imprima direto do navegador — vira PDF ao escolher 'Salvar como PDF' na janela de impressão."
        actions={(
          <button onClick={printLabels} disabled={queue.length === 0} className="btn btn-primary btn-sm" style={{ opacity: queue.length ? 1 : 0.5 }}>
            <I.Download size={13} /> Imprimir etiquetas
          </button>
        )}
      />
      <Page>
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Modelo" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {TEMPLATES.map(t => {
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
                  ['price', 'Preço de venda'], ['variant', 'Atributos da variação'],
                ].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={fields[k]} onChange={() => toggle(k)} /> {l}
                  </label>
                ))}
              </div>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Itens na fila de impressão</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Busque um produto pra adicionar à fila.</p>
              </div>
              <div style={{ padding: 14, borderBottom: queue.length ? '1px solid var(--line)' : 'none' }}>
                <ProductPicker product={null} onSelect={addProduct} />
              </div>
              {queue.length === 0 ? (
                <EmptyState icon={<I.Tag size={18} />} title="Fila vazia" desc="Busque produtos acima para adicionar." />
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr><th>Produto</th><th>SKU</th><th>Variação</th><th className="num">Preço</th><th style={{ width: 90 }}>Cópias</th><th style={{ width: 30 }}></th></tr>
                    </thead>
                    <tbody>
                      {queue.map((i) => (
                        <tr key={i.product.id}>
                          <td style={{ fontSize: 13 }}>{i.product.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i.product.sku}</td>
                          <td><AttrChip value={variantLabel(i.product.attrs || {})} /></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(i.product.sale_price)}</td>
                          <td><TextInput mono type="number" value={i.copies} onChange={(e) => setCopies(i.product.id, +e.target.value || 1)} style={{ height: 28 }} /></td>
                          <td><button onClick={() => removeItem(i.product.id)} className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                    {queue.length} SKUs · {totalLabels} etiquetas
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Pré-visualização</div>
              <div style={{
                width: tpl.wmm * 3, height: tpl.hmm * 3, margin: '0 auto',
                border: '1px solid var(--line-strong)', borderRadius: 4,
                background: '#fff', color: '#16140F',
                padding: 10, display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <LabelContent p={queue[0]?.product ?? { name: 'Nome do produto', sku: 'SKU-EXEMPLO', sale_price: 0, attrs: {}, barcode: '000' }} fields={fields} template={template} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-mono)' }}>{tpl.d}</div>
            </div>

            <FormCard title="Impressão" cols={1}>
              <Field label="Tamanho do papel">
                <SelectInput value="A4" options={['A4']} />
              </Field>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Ao clicar em &ldquo;Imprimir etiquetas&rdquo;, use a opção &ldquo;Salvar como PDF&rdquo; da janela de impressão do navegador se quiser um arquivo em vez de imprimir direto.
              </div>
            </FormCard>
          </div>
        </div>

        {/* Área de impressão real — só visível no @media print */}
        <div className="print-only" style={{ display: 'none' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm' }}>
            {printItems.map((p, i) => (
              <div key={i} style={{
                width: `${tpl.wmm}mm`, height: `${tpl.hmm}mm`,
                border: '1px solid #ccc', padding: '2mm',
                display: 'flex', flexDirection: 'column', gap: '1mm',
                color: '#000', breakInside: 'avoid',
              }}>
                <LabelContent p={p} fields={fields} template={template} />
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            @page { size: A4; margin: 8mm; }
          }
        `}</style>
      </Page>
    </StoreShell>
  );
}
