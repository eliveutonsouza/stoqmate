"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { MOCK } from '@/lib/mock';
import { I } from '@/components/icons';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { FormPageFooter } from '@/components/ui/form-page-footer';

export function SupplierForm({ mode = 'new' }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [cats, setCats] = React.useState(editing ? ['eletronicos'] : []);
  const toggle = (id) => setCats(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  return (
    <StoreShell route={editing ? '/suppliers/edit' : '/suppliers/new'} breadcrumb={['Fornecedores', editing ? 'Editar' : 'Cadastrar']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}
        sub={editing ? 'TechDistrib · 186 SKUs vinculados · R$ 186.400 comprados em 12 meses' : 'Os dados aqui alimentam as entradas de compra e os relatórios de origem.'}
      />
      <Page width={880}>
        <FormCard title="Identificação" cols={2}>
          <Field label="Nome do fornecedor" required span={2} hint="Como aparece nas entradas de estoque.">
            <TextInput defaultValue={editing ? 'TechDistrib' : ''} placeholder="TechDistrib" />
          </Field>
          <Field label="Razão social" span={2}>
            <TextInput defaultValue={editing ? 'TechDistrib Comércio de Eletrônicos Ltda.' : ''} placeholder="Razão social completa" />
          </Field>
          <Field label="CNPJ" required span={1} hint="Formato 00.000.000/0000-00">
            <TextInput mono defaultValue={editing ? '12.345.678/0001-90' : ''} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Inscrição estadual" span={1}>
            <TextInput mono defaultValue={editing ? '116.482.377.118' : ''} placeholder="Opcional" />
          </Field>
        </FormCard>

        <FormCard title="Contato" cols={2}>
          <Field label="Telefone" required span={1}>
            <TextInput mono defaultValue={editing ? '(11) 4002-1100' : ''} placeholder="(11) 4002-1100" />
          </Field>
          <Field label="WhatsApp" span={1}>
            <TextInput mono defaultValue={editing ? '(11) 98800-1100' : ''} placeholder="Opcional" />
          </Field>
          <Field label="Email de pedidos" required span={1}>
            <TextInput type="email" defaultValue={editing ? 'pedidos@techdistrib.com.br' : ''} placeholder="pedidos@fornecedor.com.br" />
          </Field>
          <Field label="Representante" span={1}>
            <TextInput defaultValue={editing ? 'Sérgio Almeida' : ''} placeholder="Nome do contato comercial" />
          </Field>
          <Field label="Endereço" span={2}>
            <TextInput defaultValue={editing ? 'Rua Funchal, 418 — Vila Olímpia, São Paulo · SP' : ''} placeholder="Logradouro, número, cidade e estado" />
          </Field>
        </FormCard>

        <FormCard title="O que este fornecedor atende" desc="Filtra o fornecedor no cadastro de produtos e nas entradas." cols={1}>
          <Field label="Categorias atendidas" required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {MOCK.categories.map(c => {
                const on = cats.includes(c.id);
                const Ico = I[c.icon] || I.Box;
                return (
                  <button key={c.id} onClick={() => toggle(c.id)} style={{
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
                    <span style={{ color: c.cssInk, display: 'flex', flexShrink: 0 }}><Ico size={13} /></span>
                    <span style={{ fontSize: 12.5, color: 'var(--fg)' }}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Marcas fornecidas" hint="Separe por vírgula.">
            <TextInput defaultValue={editing ? 'Foneclear, Voltway' : ''} placeholder="Foneclear, Voltway" />
          </Field>
        </FormCard>

        <FormCard title="Condições comerciais" cols={3}>
          <Field label="Prazo médio de entrega" span={1}>
            <TextInput mono defaultValue={editing ? '8' : ''} suffix="dias" />
          </Field>
          <Field label="Pedido mínimo" span={1}>
            <TextInput mono prefix="R$" defaultValue={editing ? '5.000,00' : ''} />
          </Field>
          <Field label="Condição de pagamento" span={1}>
            <SelectInput value={editing ? '30/60 dias' : 'À vista'} onChange={() => {}} options={['À vista', '28 dias', '30/60 dias', '30/60/90 dias', 'Boleto 45 dias']} />
          </Field>
          <Field label="Observações" span={3}>
            <TextareaInput defaultValue={editing ? 'Entrega apenas em dias úteis. Trocas por defeito aceitas em até 30 dias com laudo.' : ''} placeholder="Regras de entrega, política de troca, contatos alternativos." />
          </Field>
        </FormCard>

        <FormPageFooter
          onCancel={() => navigate('/suppliers')}
          onSave={() => navigate(editing ? '/suppliers/detail' : '/suppliers')}
          saveLabel={editing ? 'Salvar alterações' : 'Cadastrar fornecedor'}
          extra={!editing && <button className="btn btn-outline">Salvar e cadastrar outro</button>}
        />
      </Page>
    </StoreShell>
  );
}

// === /suppliers/detail ===
