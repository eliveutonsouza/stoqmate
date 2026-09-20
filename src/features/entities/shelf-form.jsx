"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { MOCK } from '@/lib/mock';
import { TextareaInput } from '@/components/ui/textarea-input';
import { FormPageFooter } from '@/components/ui/form-page-footer';

export function ShelfForm({ mode = 'new' }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  return (
    <StoreShell route={editing ? '/shelves/edit' : '/shelves/new'} breadcrumb={['Locais de estoque', editing ? 'Editar' : 'Novo']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar local de estoque' : 'Novo local de estoque'}
        sub="Locais são específicos de cada unidade — o código só precisa ser único dentro dela."
      />
      <Page width={720}>
        <FormCard title="Identificação" cols={2}>
          <Field label="Código" required span={1} hint="Curto e reconhecível pela equipe. Ex.: A-04, VITRINE-1, DEP-3.">
            <TextInput mono defaultValue={editing ? 'A-04' : ''} placeholder="G-01" />
          </Field>
          <Field label="Unidade" required span={1}>
            <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
          </Field>
          <Field label="Descrição" span={2} hint="Ajuda quem está conferindo estoque a achar o local fisicamente.">
            <TextareaInput defaultValue={editing ? 'Corredor A · altura dos olhos · eletrônicos' : ''} placeholder="Corredor G · altura média · lançamentos" />
          </Field>
        </FormCard>

        <FormCard title="Características" cols={2}>
          <Field label="Tipo de local" span={1}>
            <SelectInput value={editing ? 'Prateleira de venda' : 'Prateleira de venda'} onChange={() => {}}
              options={['Prateleira de venda', 'Gôndola', 'Arara', 'Vitrine', 'Câmara refrigerada', 'Depósito', 'Área de avaria']} />
          </Field>
          <Field label="Capacidade estimada" span={1} hint="Só informativo — não bloqueia alocação.">
            <TextInput mono defaultValue={editing ? '500' : ''} suffix="itens" />
          </Field>
          <Field label="Categorias esperadas" span={2} hint="Usado para sugerir o local no cadastro de produtos.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {MOCK.categories.map((c, i) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <input type="checkbox" defaultChecked={editing && i === 2} /> {c.name}
                </label>
              ))}
            </div>
          </Field>
        </FormCard>

        {editing && (
          <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Excluir este local</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                Só é possível com o local vazio. Hoje há <strong>62 SKUs</strong> alocados em A-04 — mova-os antes.
              </div>
            </div>
            <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Excluir local</button>
          </div>
        )}

        <FormPageFooter
          onCancel={() => navigate('/shelves')}
          onSave={() => navigate('/shelves')}
          saveLabel={editing ? 'Salvar alterações' : 'Criar local'}
          extra={!editing && <button className="btn btn-outline">Salvar e criar outro</button>}
        />
      </Page>
    </StoreShell>
  );
}
