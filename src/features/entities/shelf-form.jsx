"use client";

import { useDefaultStoreId } from '@/components/layout/shell-context';
import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { FormPageFooter } from '@/components/ui/form-page-footer';
import { createLocationAction, updateLocationAction, deleteLocationAction } from '@/features/operations/actions';

/**
 * @param {{
 *   mode?: string,
 *   categories?: Array<any>,
 *   stores?: Array<any>,
 *   location?: any,
 *   productCount?: number,
 * }} props
 */
export function ShelfForm({ mode = 'new', categories = [], stores = [], location = null, productCount = 0 }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [code, setCode] = React.useState(location?.code ?? '');
  const [description, setDescription] = React.useState(location?.description ?? '');
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(location?.store_id ?? defaultStoreId);
  const [categoryIds, setCategoryIds] = React.useState(() => new Set(location?.categoryIds ?? []));
  const toggleCategory = (id) => setCategoryIds((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  if (editing && !location) {
    return (
      <StoreShell route="/shelves/edit" breadcrumb={['Locais de estoque', 'Editar']} navigate={navigate}>
        <PageHeader title="Editar local de estoque" />
        <Page width={720}>
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
            Local não encontrado. <a href="/shelves" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/shelves'); }} style={{ color: 'var(--accent-text)' }}>Voltar aos locais</a>
          </div>
        </Page>
      </StoreShell>
    );
  }

  const submit = () => {
    setError('');
    if (code.trim().length < 1) { setError('Informe o código do local.'); return; }
    if (!storeId) { setError('Selecione a unidade.'); return; }
    startTransition(async () => {
      const result = editing
        ? await updateLocationAction({ id: location.id, code, description, categoryIds: [...categoryIds] })
        : await createLocationAction({ storeId, code, description });
      if (result?.error) { setError(result.error); return; }
      navigate('/shelves');
    });
  };

  const remove = () => {
    setError('');
    startTransition(async () => {
      const result = await deleteLocationAction(location.id);
      if (result?.error) { setError(result.error); return; }
      navigate('/shelves');
    });
  };

  return (
    <StoreShell route={editing ? '/shelves/edit' : '/shelves/new'} breadcrumb={['Locais de estoque', editing ? 'Editar' : 'Novo']} navigate={navigate}>
      <PageHeader
        title={editing ? `Editar local ${location.code}` : 'Novo local de estoque'}
        sub="Locais são específicos de cada unidade — o código só precisa ser único dentro dela."
      />
      <Page width={720}>
        <FormCard title="Identificação" cols={2}>
          <Field label="Código" required span={1} hint="Curto e reconhecível pela equipe. Ex.: A-04, VITRINE-1, DEP-3.">
            <TextInput mono value={code} onChange={(e) => setCode(e.target.value)} placeholder="G-01" />
          </Field>
          <Field label="Unidade" required span={1}>
            {editing ? (
              <TextInput value={stores.find((s) => s.id === storeId)?.name ?? ''} readOnly style={{ background: 'var(--bg-sunken)' }} />
            ) : (
              <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            )}
          </Field>
          <Field label="Descrição" span={2} hint="Ajuda quem está conferindo estoque a achar o local fisicamente.">
            <TextareaInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Corredor G · altura média · lançamentos" />
          </Field>
        </FormCard>

        <FormCard title="Categorias esperadas" desc="Usado para sugerir o local no cadastro de produtos." cols={1}>
          <div className="g3" style={{ gap: 6 }}>
            {categories.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" checked={categoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} /> {c.name}
              </label>
            ))}
          </div>
        </FormCard>

        {editing && (
          <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Excluir este local</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                {productCount > 0
                  ? <>Só é possível com o local vazio. Hoje há <strong>{productCount} SKU{productCount === 1 ? '' : 's'}</strong> alocados em {location.code} — mova-os antes.</>
                  : 'Nenhum SKU alocado neste local — pode excluir com segurança.'}
              </div>
            </div>
            <button onClick={remove} disabled={productCount > 0 || pending} className="btn btn-outline btn-sm" style={{ opacity: productCount > 0 ? 0.5 : 1, cursor: productCount > 0 ? 'not-allowed' : 'pointer' }}>
              Excluir local
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}

        <FormPageFooter
          onCancel={() => navigate('/shelves')}
          onSave={submit}
          saveLabel={pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar local'}
          saveDisabled={pending}
        />
      </Page>
    </StoreShell>
  );
}
