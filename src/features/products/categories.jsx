"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { colorHex, isColorValue } from '@/lib/attr-colors';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { createCategoryAction } from '@/features/products/actions';

const ICON_OPTIONS = ['Box', 'Shirt', 'Zap', 'Home', 'Coffee', 'Book', 'Truck', 'Tag', 'Layers', 'Pkg'];
const UNIT_OPTIONS = ['unidade', 'par', 'peça', 'caixa', 'kg', 'litro', 'metro'];

function slugKey(label) {
  return label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function emptyAttrRow() {
  return { label: '', type: 'spec', values: '' };
}

export function Categories({ initialCategories }) {
  const navigate = useNavigate();
  const categories = React.useMemo(
    () => initialCategories.map((c) => ({
      ...c,
      unitPlural: c.unit_plural,
      skus: c.products?.[0]?.count ?? 0,
      attributes: [...(c.category_attributes || [])].sort((a, b) => a.position - b.position),
    })),
    [initialCategories],
  );

  const [selectedId, setSelectedId] = React.useState(categories[0]?.id ?? null);
  const [formOpen, setFormOpen] = React.useState(false);
  const c = categories.find((cc) => cc.id === selectedId) ?? null;
  const Ico = c ? I[c.icon] || I.Box : I.Box;

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [unit, setUnit] = React.useState('unidade');
  const [icon, setIcon] = React.useState('Box');
  const [attrRows, setAttrRows] = React.useState([emptyAttrRow(), emptyAttrRow()]);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const resetForm = () => {
    setName(''); setCode(''); setUnit('unidade'); setIcon('Box'); setAttrRows([emptyAttrRow(), emptyAttrRow()]); setError('');
  };

  const submit = () => {
    setError('');
    if (name.trim().length < 2) { setError('Informe o nome da categoria.'); return; }
    if (code.trim().length < 2) { setError('Informe um prefixo de SKU (2-4 letras).'); return; }
    const attributes = attrRows
      .filter((a) => a.label.trim())
      .map((a) => ({ key: slugKey(a.label), label: a.label.trim(), type: a.type, values: a.values.split(',').map((v) => v.trim()).filter(Boolean) }));
    startTransition(async () => {
      const result = await createCategoryAction({ name, code, unit, icon, attributes });
      if (result?.error) { setError(result.error); return; }
      setFormOpen(false);
      resetForm();
    });
  };

  return (
    <StoreShell route="/categories" breadcrumb={['Catálogo', 'Categorias e atributos']} navigate={navigate}>
      <PageHeader
        title="Categorias e atributos"
        sub="O esquema de cada categoria define os atributos do SKU e a unidade de medida do estoque."
        actions={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova categoria</button>}
      />
      <Page>
        {categories.length === 0 ? (
          <EmptyState
            icon={<I.Sliders size={18} />}
            title="Nenhuma categoria ainda"
            desc="Categorias definem os atributos e a unidade de medida dos produtos. Crie a primeira pra começar a cadastrar o catálogo."
            action={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Nova categoria</button>}
          />
        ) : (
          <div className="split-nav" style={{ '--nav': '288px' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>
                {categories.length} categoria{categories.length > 1 ? 's' : ''} ativa{categories.length > 1 ? 's' : ''}
              </div>
              {categories.map((cc, i) => {
                const active = selectedId === cc.id;
                const CIco = I[cc.icon] || I.Box;
                return (
                  <button key={cc.id} onClick={() => setSelectedId(cc.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    padding: '11px 14px', textAlign: 'left',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    border: 'none', borderBottom: i < categories.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
                  }}>
                    <span style={{ color: cc.color, display: 'flex', flexShrink: 0 }}><CIco size={16} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{cc.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>
                        {cc.attributes.map((a) => a.label).join(' · ') || 'sem atributos'}
                      </span>
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', flexShrink: 0 }}>{cc.skus}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              {!c ? null : (
              <>
              <div className="g4 kpi-strip">
                {[
                  { l: 'Categoria', v: c.name, icon: <Ico size={16} /> },
                  { l: 'Prefixo do SKU', v: c.code, mono: true },
                  { l: 'Unidade de medida', v: c.unit },
                  { l: 'SKUs cadastrados', v: c.skus },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                      {m.icon && <span style={{ color: c.color, display: 'flex' }}>{m.icon}</span>}
                      <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', fontFamily: m.mono ? 'var(--font-mono)' : undefined, fontVariantNumeric: 'tabular-nums' }}>{m.v}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Atributos de {c.name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada combinação de valores gera um SKU distinto.</p>
                  </div>
                </div>
                {c.attributes.length === 0 ? (
                  <div style={{ padding: '24px 18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                    Esta categoria ainda não tem atributos — produtos dela não têm variação (cor, tamanho etc.).
                  </div>
                ) : (
                  <div className="table-scroll"><table className="table">
                    <thead>
                      <tr><th style={{ width: 36 }}>#</th><th>Atributo</th><th>Tipo</th><th>Valores cadastrados</th><th className="num">Nº</th></tr>
                    </thead>
                    <tbody>
                      {c.attributes.map((a, i) => (
                        <tr key={a.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i + 1}</td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{a.key}</div>
                          </td>
                          <td>
                            <span className="badge">{a.type === 'color' ? 'Cor' : a.type === 'size' ? 'Tamanho' : 'Especificação'}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {a.values.slice(0, 6).map((v) => (
                                <span key={v} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '2px 7px', borderRadius: 4,
                                  background: 'var(--bg-sunken)', border: '1px solid var(--line-soft)',
                                  fontSize: 11,
                                }}>
                                  {isColorValue(v) && <span style={{ width: 8, height: 8, borderRadius: 2, background: colorHex(v), border: '1px solid var(--line-strong)' }}></span>}
                                  {v}
                                </span>
                              ))}
                              {a.values.length > 6 && <span style={{ fontSize: 11, color: 'var(--fg-muted)', alignSelf: 'center' }}>+{a.values.length - 6}</span>}
                            </div>
                          </td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{a.values.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
                {c.attributes.length > 0 && (
                  <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Formato do SKU gerado</span>
                    <code style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                      padding: '4px 9px', background: 'var(--fg)', color: 'var(--bg)', borderRadius: 5,
                    }}>
                      {c.code}-PROD-{c.attributes.map((a) => a.label.substring(0, 3).toUpperCase()).join('-')}
                    </code>
                    <div style={{ flex: 1 }}></div>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                      {c.attributes.reduce((s, a) => s * (a.values.length || 1), 1).toLocaleString('pt-BR')} combinações possíveis
                    </span>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          </div>
        )}
      </Page>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); resetForm(); }} title="Nova categoria" desc="Defina o esquema — dá pra ajustar os valores depois." width={560}
        footer={<><button onClick={() => { setFormOpen(false); resetForm(); }} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Criando…' : 'Criar categoria'}</button></>}>
        <Field label="Nome da categoria" required><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Autopeças" /></Field>
        <div className="g3" style={{ gap: 14 }}>
          <Field label="Prefixo do SKU" required hint="2-4 letras."><TextInput mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="AUT" /></Field>
          <Field label="Unidade de medida" required>
            <SelectInput value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
          </Field>
          <Field label="Ícone">
            <SelectInput value={icon} onChange={setIcon} options={ICON_OPTIONS} />
          </Field>
        </div>
        <Field label="Atributos" hint="Deixe em branco pra não ter variação nesta categoria.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attrRows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <TextInput id={null} aria-label={`Nome do atributo ${i + 1}`} placeholder="Nome (ex.: Cor)" value={row.label}
                  onChange={(e) => setAttrRows((rows) => rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} />
                <SelectInput id={null} value={row.type} options={[{ value: 'spec', label: 'Especificação' }, { value: 'color', label: 'Cor' }, { value: 'size', label: 'Tamanho' }]}
                  onChange={(v) => setAttrRows((rows) => rows.map((r, j) => (j === i ? { ...r, type: v } : r)))} />
                <TextInput id={null} aria-label={`Valores do atributo ${i + 1}`} placeholder="Valores, separados por vírgula" value={row.values}
                  onChange={(e) => setAttrRows((rows) => rows.map((r, j) => (j === i ? { ...r, values: e.target.value } : r)))} />
              </div>
            ))}
            <button onClick={() => setAttrRows((rows) => [...rows, emptyAttrRow()])} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
              <I.Plus size={12} /> Adicionar atributo
            </button>
          </div>
        </Field>
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
      </Modal>
    </StoreShell>
  );
}
