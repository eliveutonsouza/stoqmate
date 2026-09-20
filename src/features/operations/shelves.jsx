"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { LOCATIONS } from '@/features/operations/locations';
import { CATALOG } from '@/lib/catalog';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { CategoryBadge } from '@/components/ui/category-badge';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SelectInput } from '@/components/ui/select-input';
import { MOCK } from '@/lib/mock';

export function Shelves() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(LOCATIONS[0]);
  const locProducts = CATALOG.filter(p => p.loc === selected.code).slice(0, 8);

  return (
    <StoreShell route="/shelves" breadcrumb={['Locais de estoque']} navigate={navigate}>
      <PageHeader
        title="Locais de estoque"
        sub="10 posições nesta unidade · 16.330 itens localizados"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.QR size={13} /> Imprimir etiquetas</button>
            <button onClick={() => navigate('/shelves/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Novo local</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>
              Locais em Loja Centro
            </div>
            {LOCATIONS.map((s, i) => {
              const active = selected.code === s.code;
              return (
                <button key={s.code} onClick={() => setSelected(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                  padding: '11px 14px', textAlign: 'left',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  border: 'none', borderBottom: i < LOCATIONS.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    padding: '3px 7px', borderRadius: 4,
                    background: active ? 'var(--accent-strong)' : 'var(--bg-sunken)',
                    color: active ? '#fff' : 'var(--fg-muted)',
                    border: '1px solid ' + (active ? 'transparent' : 'var(--line)'),
                    flexShrink: 0, minWidth: 48, textAlign: 'center',
                  }}>{s.code}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{s.desc}</span>
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', flexShrink: 0 }}>{s.items}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Local', v: selected.code, mono: true },
                { l: 'SKUs alocados', v: selected.skus },
                { l: 'Itens na posição', v: selected.items.toLocaleString('pt-BR') },
                { l: 'Categorias', v: selected.cats.length },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4, fontFamily: m.mono ? 'var(--font-mono)' : undefined, fontVariantNumeric: 'tabular-nums' }}>{m.v}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Produtos em {selected.code}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{selected.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigate('/shelves/edit')} className="btn btn-outline btn-sm">Editar local</button>
                  <button className="btn btn-primary btn-sm"><I.Plus size={12} /> Alocar produto</button>
                </div>
              </div>
              {locProducts.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr><th>SKU</th><th>Produto</th><th>Categoria</th><th>Variação</th><th className="num">Itens</th><th style={{ width: 90 }}></th></tr>
                  </thead>
                  <tbody>
                    {locProducts.map(p => (
                      <tr key={p.sku}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                        <td style={{ fontSize: 13 }}>{p.name}</td>
                        <td><CategoryBadge cat={p.cat} /></td>
                        <td><AttrChip value={variantLabel(p.attrs)} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{p.stock}</td>
                        <td><button className="btn btn-ghost btn-sm">Mover</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  icon={<I.Grid size={18} />}
                  title="Nenhum produto neste local ainda"
                  desc={`${selected.code} está cadastrado mas sem itens alocados. Aloque produtos para que a equipe os encontre na conferência.`}
                  action={<button className="btn btn-primary btn-sm"><I.Plus size={12} /> Alocar produto</button>}
                />
              )}
              {locProducts.length > 0 && (
                <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                  Mostrando {locProducts.length} de {selected.skus} SKUs nesta posição
                </div>
              )}
            </div>
          </div>
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo local de estoque" desc="Use um código curto que a equipe reconheça na operação." width={440}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setFormOpen(false)} className="btn btn-primary">Criar local</button></>}>
        <Field label="Código" required hint="Deve ser único nesta unidade. Ex.: A-04, VITRINE-1, DEP-3.">
          <TextInput mono placeholder="G-01" />
        </Field>
        <Field label="Descrição"><TextareaInput placeholder="Corredor G · altura média · lançamentos" /></Field>
        <Field label="Unidade" hint="Locais são específicos de cada loja.">
          <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
        </Field>
        <Field label="Capacidade estimada" hint="Só informativo — não bloqueia alocação.">
          <TextInput mono placeholder="500" suffix="itens" />
        </Field>
      </Modal>
    </StoreShell>
  );
}
