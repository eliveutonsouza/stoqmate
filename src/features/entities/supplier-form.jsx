"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { FormPageFooter } from '@/components/ui/form-page-footer';
import { createSupplierAction, updateSupplierAction } from '@/features/operations/actions';

const PAYMENT_TERMS = ['À vista', '28 dias', '30/60 dias', '30/60/90 dias', 'Boleto 45 dias'];

function initialForm(supplier) {
  return {
    name: supplier?.name ?? '',
    cnpj: supplier?.cnpj ?? '',
    phone: supplier?.phone ?? '',
    whatsapp: supplier?.whatsapp ?? '',
    email: supplier?.order_email ?? '',
    salesRep: supplier?.sales_rep ?? '',
    address: supplier?.address?.full ?? '',
    categoryIds: new Set(supplier?.categoryIds ?? []),
    brands: (supplier?.brands ?? []).join(', '),
    leadTimeDays: supplier?.lead_time_days ? String(supplier.lead_time_days) : '',
    minOrderValue: supplier?.min_order_value ? String(supplier.min_order_value) : '',
    paymentTerms: supplier?.payment_terms ?? PAYMENT_TERMS[0],
    notes: supplier?.notes ?? '',
  };
}

/**
 * @param {{ mode?: string, categories?: Array<any>, supplier?: any }} props
 */
export function SupplierForm({ mode = 'new', categories = [], supplier = null }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [f, setF] = React.useState(() => initialForm(supplier));
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleCategory = (id) => setF((s) => {
    const n = new Set(s.categoryIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    return { ...s, categoryIds: n };
  });
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  if (editing && !supplier) {
    return (
      <StoreShell route="/suppliers/edit" breadcrumb={['Fornecedores', 'Editar']} navigate={navigate}>
        <PageHeader title="Editar fornecedor" />
        <Page width={880}>
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
            Fornecedor não encontrado. <a href="#" onClick={(e) => { e.preventDefault(); navigate('/suppliers'); }} style={{ color: 'var(--accent-text)' }}>Voltar aos fornecedores</a>
          </div>
        </Page>
      </StoreShell>
    );
  }

  const submit = () => {
    setError('');
    if (f.name.trim().length < 2) { setError('Informe o nome do fornecedor.'); return; }
    startTransition(async () => {
      const payload = {
        name: f.name, cnpj: f.cnpj, phone: f.phone, whatsapp: f.whatsapp, email: f.email,
        salesRep: f.salesRep, address: f.address, categoryIds: [...f.categoryIds], brands: f.brands,
        leadTimeDays: f.leadTimeDays ? parseInt(f.leadTimeDays, 10) : null,
        minOrderValue: f.minOrderValue ? parseFloat(f.minOrderValue.replace(',', '.')) : null,
        paymentTerms: f.paymentTerms, notes: f.notes,
      };
      const result = editing
        ? await updateSupplierAction({ id: supplier.id, ...payload })
        : await createSupplierAction(payload);
      if (result?.error) { setError(result.error); return; }
      navigate(editing ? `/suppliers/detail?id=${supplier.id}` : '/suppliers');
    });
  };

  return (
    <StoreShell route={editing ? '/suppliers/edit' : '/suppliers/new'} breadcrumb={['Fornecedores', editing ? 'Editar' : 'Cadastrar']} navigate={navigate}>
      <PageHeader
        title={editing ? `Editar ${supplier.name}` : 'Cadastrar fornecedor'}
        sub="Os dados aqui alimentam as entradas de compra e os relatórios de origem."
      />
      <Page width={880}>
        <FormCard title="Identificação" cols={2}>
          <Field label="Nome do fornecedor" required span={2} hint="Como aparece nas entradas de estoque.">
            <TextInput value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="TechDistrib" />
          </Field>
          <Field label="CNPJ" span={1} hint="Formato 00.000.000/0000-00">
            <TextInput mono value={f.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Endereço" span={1}>
            <TextInput value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Logradouro, número, cidade e estado" />
          </Field>
        </FormCard>

        <FormCard title="Contato" cols={2}>
          <Field label="Telefone" span={1}>
            <TextInput mono value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 4002-1100" />
          </Field>
          <Field label="WhatsApp" span={1}>
            <TextInput mono value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(11) 98800-1100" />
          </Field>
          <Field label="Email de pedidos" span={1}>
            <TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="pedidos@fornecedor.com.br" />
          </Field>
          <Field label="Representante" span={1}>
            <TextInput value={f.salesRep} onChange={(e) => set('salesRep', e.target.value)} placeholder="Nome do contato comercial" />
          </Field>
        </FormCard>

        <FormCard title="O que este fornecedor atende" desc="Filtra o fornecedor no cadastro de produtos e nas entradas." cols={1}>
          <Field label="Categorias atendidas">
            <div className="g3" style={{ gap: 8 }}>
              {categories.map(c => {
                const on = f.categoryIds.has(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCategory(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                    padding: '9px 11px',
                    border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                    background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    borderRadius: 7,
                  }}>
                    <span style={{
                      width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                      border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'),
                      background: on ? 'var(--accent-strong)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>{on && <I.Check size={9} stroke={3} />}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--fg)' }}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Marcas fornecidas" hint="Separe por vírgula.">
            <TextInput value={f.brands} onChange={(e) => set('brands', e.target.value)} placeholder="Foneclear, Voltway" />
          </Field>
        </FormCard>

        <FormCard title="Condições comerciais" cols={3}>
          <Field label="Prazo médio de entrega" span={1}>
            <TextInput mono value={f.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)} suffix="dias" />
          </Field>
          <Field label="Pedido mínimo" span={1}>
            <TextInput mono prefix="R$" value={f.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />
          </Field>
          <Field label="Condição de pagamento" span={1}>
            <SelectInput value={f.paymentTerms} onChange={(v) => set('paymentTerms', v)} options={PAYMENT_TERMS} />
          </Field>
          <Field label="Observações" span={3}>
            <TextareaInput value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Regras de entrega, política de troca, contatos alternativos." />
          </Field>
        </FormCard>

        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}

        <FormPageFooter
          onCancel={() => navigate('/suppliers')}
          onSave={submit}
          saveLabel={pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar fornecedor'}
          saveDisabled={pending}
        />
      </Page>
    </StoreShell>
  );
}
