"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { Modal } from '@/components/ui/modal';

export function SettingsBilling() {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = React.useState(false);
  const methods = [
    { id: 'c1', kind: 'Cartão de crédito', label: 'Visa •••• 4242', sub: 'Mariana S Souza · vence 09/2029', main: true },
    { id: 'c2', kind: 'Cartão de crédito', label: 'Master •••• 8810', sub: 'Bonsucesso Varejo LTDA · vence 03/2028', main: false },
    { id: 'p1', kind: 'PIX automático', label: 'Banco do Brasil · ag 1234', sub: 'Autorização de débito ativa', main: false },
  ];
  return (
    <StoreShell route="/settings/billing" breadcrumb={['Configurações', 'Cobrança']} navigate={navigate}>
      <PageHeader title="Cobrança" sub="Meios de pagamento, dados fiscais e para onde a nota vai." />
      <SettingsLayout route="/settings/billing" navigate={navigate}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Meios de pagamento</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>O segundo cartão é usado automaticamente se o principal falhar.</p>
            </div>
            <button onClick={() => setAddOpen(true)} className="btn btn-outline btn-sm"><I.Plus size={12} /> Adicionar</button>
          </div>
          <div>
            {methods.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 18px', borderBottom: i < methods.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><I.Credit size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                    {m.main && <span className="badge badge-success">Principal</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.kind} · {m.sub}</div>
                </div>
                {!m.main && <button className="btn btn-ghost btn-sm">Tornar principal</button>}
                <button className="btn btn-ghost btn-sm">Remover</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            Boleto está disponível apenas no ciclo anual. No mensal, cartão ou PIX automático — é o que garante que o acesso não caia por esquecimento.
          </div>
        </div>

        <FormCard title="Dados fiscais" desc="Aparecem na NFS-e de cada cobrança.">
          <Field label="Razão social" span={2}><TextInput defaultValue="Bonsucesso Comércio de Varejo LTDA" /></Field>
          <Field label="CNPJ"><TextInput mono defaultValue="12.345.678/0001-90" /></Field>
          <Field label="Inscrição municipal"><TextInput mono defaultValue="1.234.567-8" /></Field>
          <Field label="Email para nota fiscal" hint="Aceita mais de um, separado por vírgula." span={2}>
            <TextInput type="email" defaultValue="financeiro@bonsucesso.com.br, mariana@bonsucesso.com.br" />
          </Field>
          <Field label="CEP"><TextInput mono defaultValue="20000-000" /></Field>
          <Field label="Cidade"><TextInput defaultValue="Rio de Janeiro · RJ" /></Field>
        </FormCard>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Dia de vencimento</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>Hoje a cobrança cai no dia 01. Você pode mover para o dia 10 ou 20 para casar com o caixa da loja.</div>
          </div>
          <SelectInput value="Dia 01" onChange={() => {}} options={['Dia 01', 'Dia 10', 'Dia 20']} />
        </div>
      </SettingsLayout>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar meio de pagamento" desc="Nenhuma cobrança é feita agora." width={480}
        footer={<><button onClick={() => setAddOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setAddOpen(false)} className="btn btn-primary">Salvar cartão</button></>}>
        <Field label="Número do cartão" required><TextInput mono placeholder="0000 0000 0000 0000" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Validade" required><TextInput mono placeholder="MM/AA" /></Field>
          <Field label="CVV" required><TextInput mono placeholder="123" /></Field>
        </div>
        <Field label="Nome impresso" required><TextInput placeholder="MARIANA S SOUZA" /></Field>
      </Modal>
    </StoreShell>
  );
}

// === /settings/subscription/invoice — fatura aberta com NFS-e ===
