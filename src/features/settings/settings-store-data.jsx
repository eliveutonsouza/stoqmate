"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { Modal } from '@/components/ui/modal';
import { I } from '@/components/icons';

export function SettingsStoreData() {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  return (
    <StoreShell route="/settings/store-data" breadcrumb={['Configurações', 'Dados da loja']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/store-data" navigate={navigate}>
        <FormCard title="Dados cadastrais" desc="Aparecem no cabeçalho dos relatórios e nas notas de compra." cols={2}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          <Field label="Nome da loja" required span={2}><TextInput defaultValue="Bonsucesso Varejo" /></Field>
          <Field label="Razão social" span={2}><TextInput defaultValue="Bonsucesso Comércio Varejista Ltda." /></Field>
          <Field label="CNPJ" span={1}><TextInput mono defaultValue="24.531.908/0001-72" /></Field>
          <Field label="Inscrição estadual" span={1}><TextInput mono defaultValue="116.482.377.118" /></Field>
          <Field label="Telefone" span={1}><TextInput mono defaultValue="(11) 3813-4400" /></Field>
          <Field label="Email de contato" span={1}><TextInput type="email" defaultValue="contato@bonsucesso.com.br" /></Field>
        </FormCard>

        <FormCard title="Endereço" cols={2}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          <Field label="CEP" span={1}><TextInput mono defaultValue="01451-000" /></Field>
          <Field label="Logradouro" span={1}><TextInput defaultValue="Av. Brigadeiro Faria Lima" /></Field>
          <Field label="Número" span={1}><TextInput mono defaultValue="2232" /></Field>
          <Field label="Complemento" span={1}><TextInput defaultValue="Loja 14 · Piso Térreo" /></Field>
          <Field label="Cidade" span={1}><TextInput defaultValue="São Paulo" /></Field>
          <Field label="Estado" span={1}>
            <SelectInput value="SP" onChange={() => {}} options={['SP','RJ','MG','PR','RS','SC','BA','PE','CE','DF','GO','AM']} />
          </Field>
        </FormCard>

        <FormCard title="Preferências de operação" cols={2}
          footer={<button className="btn btn-primary">Salvar alterações</button>}>
          <Field label="Estoque mínimo padrão" span={1} hint="Padrão para novas categorias.">
            <TextInput mono defaultValue="5" suffix="pares" />
          </Field>
          <Field label="Nível crítico de alerta" span={1} hint="Dispara notificação no dashboard.">
            <TextInput mono defaultValue="2" suffix="pares" />
          </Field>
          <Field label="Desconto máximo sem aprovação" span={1}>
            <TextInput mono defaultValue="20" suffix="%" />
          </Field>
          <Field label="Fuso horário" span={1}>
            <SelectInput value="America/Sao_Paulo" onChange={() => {}} options={['America/Sao_Paulo','America/Manaus','America/Recife','America/Fortaleza']} />
          </Field>
        </FormCard>

        <div className="card" style={{ borderColor: 'var(--danger)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--danger)' }}>Zona de risco</h3>
          </div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Apagar dados de exemplo</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Remove os SKUs e o histórico gerados no onboarding. Não afeta o que você cadastrou.</div>
              </div>
              <button className="btn btn-outline btn-sm">Apagar exemplos</button>
            </div>
            <div style={{ height: 1, background: 'var(--line-soft)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Excluir a conta</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Cancela a assinatura de toda a rede e remove os dados após 90 dias. Irreversível.</div>
              </div>
              <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm">Excluir conta</button>
            </div>
          </div>
        </div>
      </SettingsLayout>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir Bonsucesso Varejo?" desc="Cancela a assinatura de todas as unidades e agenda a remoção definitiva dos dados." width={460}
        footer={<>
          <button onClick={() => setDeleteOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={() => setDeleteOpen(false)} className="btn btn-danger">Excluir permanentemente</button>
        </>}>
        <div style={{ padding: '12px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 8, display: 'flex', gap: 11 }}>
          <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }}><I.Alert size={15} /></span>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            Serão removidos <strong>1.688 SKUs</strong> em 6 categorias, <strong>1.142 movimentações</strong>, 6 fornecedores e 8 usuários, nas 4 unidades.
            Exporte seus dados antes — após 90 dias não há recuperação.
          </div>
        </div>
        <Field label="Digite o nome da loja para confirmar" required>
          <TextInput placeholder="Bonsucesso Varejo" />
        </Field>
      </Modal>
    </StoreShell>
  );
}
