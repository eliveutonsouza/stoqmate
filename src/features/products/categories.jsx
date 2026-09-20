"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { I } from '@/components/icons';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { colorHex, isColorValue } from '@/lib/attr-colors';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { Modal } from '@/components/ui/modal';

export function Categories() {
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState(MOCK.categories[0].id);
  const [formOpen, setFormOpen] = React.useState(false);
  const c = catById(selected);
  const Ico = I[c.icon] || I.Box;

  return (
    <StoreShell route="/categories" breadcrumb={['Catálogo', 'Categorias e atributos']} navigate={navigate}>
      <PageHeader
        title="Categorias e atributos"
        sub="O esquema de cada categoria define os atributos do SKU e a unidade de medida do estoque."
        actions={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova categoria</button>}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: '288px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>
              6 categorias ativas
            </div>
            {MOCK.categories.map((cc, i) => {
              const active = selected === cc.id;
              const CIco = I[cc.icon] || I.Box;
              return (
                <button key={cc.id} onClick={() => setSelected(cc.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                  padding: '11px 14px', textAlign: 'left',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  border: 'none', borderBottom: i < MOCK.categories.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
                }}>
                  <span style={{ color: cc.cssInk, display: 'flex', flexShrink: 0 }}><CIco size={16} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{cc.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>
                      {cc.attributes.map(a => a.label).join(' · ')}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', flexShrink: 0 }}>{cc.skus}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Categoria', v: c.name, icon: <Ico size={16} /> },
                { l: 'Prefixo do SKU', v: c.code, mono: true },
                { l: 'Unidade de medida', v: c.unit },
                { l: 'Itens em estoque', v: c.stock.toLocaleString('pt-BR') },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                    {m.icon && <span style={{ color: c.cssInk, display: 'flex' }}>{m.icon}</span>}
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
                <button className="btn btn-outline btn-sm"><I.Plus size={12} /> Adicionar atributo</button>
              </div>
              <table className="table">
                <thead>
                  <tr><th style={{ width: 36 }}>#</th><th>Atributo</th><th>Tipo</th><th>Valores cadastrados</th><th className="num">Nº</th><th style={{ width: 30 }}></th></tr>
                </thead>
                <tbody>
                  {c.attributes.map((a, i) => (
                    <tr key={a.key}>
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
                          {a.values.slice(0, 6).map(v => (
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
                      <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Formato do SKU gerado</span>
                <code style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                  padding: '4px 9px', background: 'var(--fg)', color: 'var(--bg)', borderRadius: 5,
                }}>
                  {c.code}-PROD-{c.attributes.map(a => a.label.substring(0, 3).toUpperCase()).join('-')}
                </code>
                <div style={{ flex: 1 }}></div>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  {c.attributes.reduce((s, a) => s * a.values.length, 1).toLocaleString('pt-BR')} combinações possíveis
                </span>
              </div>
            </div>

            <FormCard title="Regras de estoque" desc={`Aplicadas a todos os ${c.skus} SKUs de ${c.name}.`} cols={3}
              footer={<button className="btn btn-primary">Salvar alterações</button>}>
              <Field label="Unidade de medida" span={1} hint="Como o saldo é contado e exibido.">
                <SelectInput value={c.unit} onChange={() => {}} options={['unidade', 'par', 'peça', 'caixa', 'kg', 'litro', 'metro']} />
              </Field>
              <Field label="Estoque mínimo padrão" span={1} hint="Dispara o alerta de reposição.">
                <TextInput mono defaultValue={c.id === 'alimentos' ? '40' : '10'} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
              </Field>
              <Field label="Prefixo do SKU" span={1} hint="Três letras, únicas por categoria.">
                <TextInput mono defaultValue={c.code} />
              </Field>
            </FormCard>
          </div>
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova categoria" desc="Comece por um modelo pronto ou monte o esquema do zero." width={520}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setFormOpen(false)} className="btn btn-primary">Criar categoria</button></>}>
        <Field label="Nome da categoria" required><TextInput placeholder="Autopeças" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Prefixo do SKU" required hint="Três letras."><TextInput mono placeholder="AUT" /></Field>
          <Field label="Unidade de medida" required>
            <SelectInput value="unidade" onChange={() => {}} options={['unidade', 'par', 'peça', 'caixa', 'kg', 'litro', 'metro']} />
          </Field>
        </div>
        <Field label="Começar a partir de um modelo" hint="Os atributos vêm preenchidos e podem ser editados depois.">
          <SelectInput value="Em branco" onChange={() => {}}
            options={['Em branco', 'Vestuário (Cor · Tamanho)', 'Calçados (Cor · Numeração)', 'Eletrônicos (Cor · Capacidade)', 'Alimentos (Sabor · Peso)', 'Autopeças (Montadora · Código OEM)']} />
        </Field>
        <Field label="Atributos" hint="Você pode adicionar quantos precisar depois de criar.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {['Cor', 'Tamanho', 'Capacidade', 'Material', 'Peso', 'Voltagem'].map((a, i) => (
              <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" defaultChecked={i < 2} /> {a}
              </label>
            ))}
          </div>
        </Field>
      </Modal>
    </StoreShell>
  );
}
