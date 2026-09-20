"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { I } from '@/components/icons';
import { AIClassifyRow } from '@/features/product-detail/ai-classify-row';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';

export function ProductForm() {
  const navigate = useNavigate();
  const [catId, setCatId] = React.useState('eletronicos');
  const cat = catById(catId);

  const [f, setF] = React.useState({
    brand: 'Foneclear', name: 'Fone Bluetooth ANC',
    purchase: '158,00', sale: '299,00', min: '10',
    supplier: 'TechDistrib', loc: 'A-04', barcode: '', photo: false, notes: '',
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  // Attribute values are keyed per category so switching category resets cleanly.
  const [attrs, setAttrs] = React.useState({});
  const attrVal = (key) => attrs[catId]?.[key] ?? '';
  const setAttr = (key, v) => setAttrs(s => ({ ...s, [catId]: { ...(s[catId] || {}), [key]: v } }));

  React.useEffect(() => {
    setAttrs(s => s[catId] ? s : ({ ...s, [catId]: Object.fromEntries(cat.attributes.map(a => [a.key, a.values[0]])) }));
  }, [catId]);

  const slug = (s, n) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, n);
  const sku = [cat.code, slug(f.name, 4), ...cat.attributes.map(a => slug(attrVal(a.key), 3))].filter(Boolean).join('-');

  const pNum = parseFloat((f.purchase || '0').replace(/\./g, '').replace(',', '.')) || 0;
  const sNum = parseFloat((f.sale || '0').replace(/\./g, '').replace(',', '.')) || 0;
  const margin = sNum > 0 ? ((sNum - pNum) / sNum) * 100 : 0;
  const missingAttr = cat.attributes.find(a => !attrVal(a.key));

  return (
    <StoreShell route="/products/new" breadcrumb={['Catálogo', 'Cadastrar produto']} navigate={navigate}>
      <PageHeader
        title="Cadastrar produto"
        sub="Escolha a categoria — os atributos e a unidade de medida vêm do esquema dela."
        actions={(
          <>
            <button onClick={() => navigate('/products')} className="btn btn-ghost btn-sm">Cancelar</button>
            <button className="btn btn-outline btn-sm">Salvar e criar outro</button>
            <button onClick={() => navigate('/products/detail')} className="btn btn-primary btn-sm">Salvar produto</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 296px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Categoria" desc="Define quais atributos o produto terá e como o estoque é contado." cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {MOCK.categories.map(cc => {
                  const active = catId === cc.id;
                  const CIco = I[cc.icon] || I.Box;
                  return (
                    <button key={cc.id} onClick={() => setCatId(cc.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      padding: '10px 12px',
                      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                      background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      borderRadius: 7,
                    }}>
                      <span style={{ color: cc.cssInk, display: 'flex', flexShrink: 0 }}><CIco size={16} /></span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--fg)' }}>{cc.name}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--fg-muted)' }}>{cc.attributes.map(a => a.label).join(' · ')}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormCard>

            <FormCard title="Identificação" desc={`O SKU é gerado a partir da categoria, do nome e dos ${cat.attributes.length} atributos de ${cat.name}.`} cols={2}>
              <div style={{ gridColumn: 'span 2' }}>
                <AIClassifyRow
                  cat={cat}
                  onApply={(s) => {
                    const hit = MOCK.categories.find(c => c.name.toLowerCase() === String(s.category || '').toLowerCase());
                    if (hit) setCatId(hit.id);
                    if (s.brand) set('brand', s.brand);
                    if (s.productName) set('name', s.productName);
                    if (s.attributes) {
                      const target = hit ? hit.id : catId;
                      setAttrs(prev => ({ ...prev, [target]: { ...(prev[target] || {}), ...s.attributes } }));
                    }
                  }}
                />
              </div>
              <Field label="Marca" required span={1}>
                <TextInput value={f.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Foneclear" />
              </Field>
              <Field label="Nome do produto" required span={1}>
                <TextInput value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Fone Bluetooth ANC" />
              </Field>
              {cat.attributes.map(a => (
                <Field key={a.key} label={a.label} required span={1}
                  error={!attrVal(a.key) ? `${a.label} é obrigatório para gerar o SKU.` : null}
                  hint={`Valores definidos no esquema de ${cat.name}.`}>
                  <SelectInput value={attrVal(a.key)} onChange={(v) => setAttr(a.key, v)} options={a.values} placeholder="Selecione…" />
                </Field>
              ))}
              <Field label="Código de barras" span={2} hint="EAN-13. Opcional — pode ser lido pelo leitor no balcão.">
                <TextInput mono value={f.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="7891234560128" />
              </Field>
            </FormCard>

            <FormCard title="Preços e estoque" cols={3}>
              <Field label="Preço de compra" required span={1}>
                <TextInput mono prefix="R$" value={f.purchase} onChange={(e) => set('purchase', e.target.value)} />
              </Field>
              <Field label="Preço de venda" required span={1}>
                <TextInput mono prefix="R$" value={f.sale} onChange={(e) => set('sale', e.target.value)} />
              </Field>
              <Field label="Estoque mínimo" span={1} hint="Dispara alerta de reposição.">
                <TextInput mono value={f.min} onChange={(e) => set('min', e.target.value)} suffix={cat.unit === 'unidade' ? 'un' : cat.unit} />
              </Field>
            </FormCard>

            <FormCard title="Localização e origem" cols={2}>
              <Field label="Fornecedor" span={1}>
                <SelectInput value={f.supplier} onChange={(v) => set('supplier', v)} options={['TechDistrib', 'Vento Sul', 'Malha & Cia', 'Grão Nobre', 'Lar Import', 'Papel Forte']} placeholder="Selecione…" />
              </Field>
              <Field label="Local de estoque" span={1} hint="Onde o item fica fisicamente nesta unidade.">
                <SelectInput value={f.loc} onChange={(v) => set('loc', v)} options={['A-04', 'A-05', 'B-12', 'B-14', 'C-01', 'C-03', 'D-02', 'E-06', 'F-01', 'Depósito']} placeholder="Selecione…" />
              </Field>
              <Field label="Observações" span={2}>
                <TextareaInput value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ex.: item com garantia estendida de 12 meses pelo fornecedor." />
              </Field>
            </FormCard>

            <FormCard title="Foto do produto" desc="Uma foto por SKU. Aparece na lista, no detalhe e nas etiquetas." cols={1}>
              {!f.photo ? (
                <div onClick={() => set('photo', true)} style={{
                  border: '1.5px dashed var(--line-strong)', borderRadius: 10,
                  padding: '32px 24px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Arraste a foto aqui</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                    ou <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>escolha do computador</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>JPG · PNG · WEBP · até 5 MB</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="placeholder-stripes" style={{ width: 84, height: 84, borderRadius: 8, border: '1px solid var(--line)', flexShrink: 0 }}>foto</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>fone-anc-preto.jpg</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>JPG · 412 KB · 1200×1200</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button className="btn btn-outline btn-sm">Substituir</button>
                      <button onClick={() => set('photo', false)} className="btn btn-ghost btn-sm">Remover</button>
                    </div>
                  </div>
                </div>
              )}
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>SKU gerado</div>
              <div style={{
                padding: '10px 12px', background: 'var(--fg)', color: 'var(--bg)',
                borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
                letterSpacing: '0.02em', textAlign: 'center', wordBreak: 'break-all',
              }}>{sku || '—'}</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[['Cat.', cat.code], ['Produto', slug(f.name, 4)], ...cat.attributes.map(a => [a.label, slug(attrVal(a.key), 3)])].map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center', padding: '4px 7px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 5 }}>
                    <div style={{ fontSize: 9, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 1 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 12 }}>
                <SummaryRow label="Compra" value={brl(pNum)} />
                <SummaryRow label="Venda" value={brl(sNum)} />
                <SummaryRow label={`Lucro por ${cat.unit}`} value={brl(sNum - pNum)} tone={sNum > pNum ? 'success' : 'danger'} />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="Margem" value={margin.toFixed(1) + '%'} strong tone={margin >= 30 ? 'success' : margin > 0 ? 'warning' : 'danger'} />
                </div>
              </div>
            </div>

            {missingAttr && (
              <div style={{ padding: '12px 14px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
                <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>
                  Defina <strong>{missingAttr.label}</strong> para completar o SKU.
                </div>
              </div>
            )}

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Sliders size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Faltando um atributo em <strong>{cat.name}</strong>?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/categories'); }} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Edite o esquema da categoria</a>{' '}
                e ele aparece aqui na hora.
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--fg-muted)', padding: '0 4px', lineHeight: 1.5 }}>
              Plano Controle · 1.688 de SKUs ilimitados utilizados.
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}


// === AI classification, inside the create form ===
// Typing a name is unavoidable; picking category + every attribute is not.
