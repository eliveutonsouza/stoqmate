"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
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
import { createLocationAction } from '@/features/operations/actions';

export function Shelves({ initialLocations, products, stores }) {
  const navigate = useNavigate();
  const locations = React.useMemo(
    () => initialLocations.map((l) => ({ ...l, skus: l.products?.[0]?.count ?? 0 })),
    [initialLocations],
  );

  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(locations[0]?.id ?? null);
  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const locProducts = selected ? products.filter((p) => p.default_location_id === selected.id) : [];

  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? '');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    if (code.trim().length < 1) { setError('Informe o código do local.'); return; }
    if (!storeId) { setError('Selecione a unidade.'); return; }
    startTransition(async () => {
      const result = await createLocationAction({ storeId, code, description });
      if (result?.error) { setError(result.error); return; }
      setFormOpen(false);
      setCode(''); setDescription('');
    });
  };

  return (
    <StoreShell route="/shelves" breadcrumb={['Locais de estoque']} navigate={navigate}>
      <PageHeader
        title="Locais de estoque"
        sub={`${locations.length} posiç${locations.length === 1 ? 'ão' : 'ões'} cadastrada${locations.length === 1 ? '' : 's'}`}
        actions={(
          <>
            <button onClick={() => navigate('/labels')} className="btn btn-outline btn-sm"><I.QR size={13} /> Imprimir etiquetas</button>
            <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Novo local</button>
          </>
        )}
      />
      <Page>
        {locations.length === 0 || !selected ? (
          <EmptyState
            icon={<I.Grid size={18} />}
            title="Nenhum local de estoque ainda"
            desc="Locais ajudam a equipe a encontrar produtos fisicamente na loja."
            action={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Novo local</button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>
                Locais cadastrados
              </div>
              {locations.map((s, i) => {
                const active = selected.id === s.id;
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    padding: '11px 14px', textAlign: 'left',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    border: 'none', borderBottom: i < locations.length - 1 ? '1px solid var(--line-soft)' : 'none',
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
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{s.description ?? '—'}</span>
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', flexShrink: 0 }}>{s.skus}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { l: 'Local', v: selected.code, mono: true },
                  { l: 'SKUs alocados', v: selected.skus },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRight: i === 0 ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4, fontFamily: m.mono ? 'var(--font-mono)' : undefined, fontVariantNumeric: 'tabular-nums' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Produtos em {selected.code}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{selected.description ?? '—'}</p>
                  </div>
                  <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Cadastrar produto aqui</button>
                </div>
                {locProducts.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr><th>SKU</th><th>Produto</th><th>Categoria</th><th>Variação</th></tr>
                    </thead>
                    <tbody>
                      {locProducts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                          <td style={{ fontSize: 13 }}>{p.name}</td>
                          <td>{p.category && <CategoryBadge category={p.category} />}</td>
                          <td><AttrChip value={variantLabel(p.attrs || {})} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState
                    icon={<I.Grid size={18} />}
                    title="Nenhum produto neste local ainda"
                    desc={`${selected.code} está cadastrado mas sem itens alocados como local padrão.`}
                    action={<button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Cadastrar produto</button>}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Page>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setError(''); }} title="Novo local de estoque" desc="Use um código curto que a equipe reconheça na operação." width={440}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Criando…' : 'Criar local'}</button></>}>
        <Field label="Código" required hint="Deve ser único nesta unidade. Ex.: A-04, VITRINE-1, DEP-3.">
          <TextInput mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="G-01" />
        </Field>
        <Field label="Descrição"><TextareaInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Corredor G · altura média · lançamentos" /></Field>
        <Field label="Unidade" hint="Locais são específicos de cada loja.">
          <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
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
