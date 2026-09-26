"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { Modal } from '@/components/ui/modal';
import { I } from '@/components/icons';
import { updateCompanyDataAction, requestAccountDeletionAction } from '@/features/settings/actions';

export function SettingsStoreData({ company }) {
  const navigate = useNavigate();
  const [name, setName] = React.useState(company.name);
  const [cnpj, setCnpj] = React.useState(company.cnpj);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState('');
  const [deleteError, setDeleteError] = React.useState('');
  const [deletePending, startDeleteTransition] = React.useTransition();

  const save = () => {
    setError(''); setSaved(false);
    startTransition(async () => {
      const result = await updateCompanyDataAction({ name, cnpj });
      if (result?.error) { setError(result.error); return; }
      setSaved(true);
    });
  };

  const confirmDelete = () => {
    setDeleteError('');
    if (confirmName.trim() !== company.name.trim()) { setDeleteError('O nome digitado não confere.'); return; }
    startDeleteTransition(async () => {
      const result = await requestAccountDeletionAction();
      if (result?.error) { setDeleteError(result.error); return; }
      navigate('/login');
    });
  };

  return (
    <StoreShell route="/settings/store-data" breadcrumb={['Configurações', 'Dados da loja']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/store-data" navigate={navigate}>
        <FormCard title="Dados cadastrais" desc="O nome identifica a rede no painel; o CNPJ fica no cadastro da conta (suporte e cobrança)." cols={2}
          footer={<button onClick={save} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar alterações'}</button>}>
          <Field label="Nome da loja" required span={2}><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="CNPJ" span={1}><TextInput mono value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" /></Field>
          {error && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
          {saved && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--success)' }}>Dados atualizados.</div>}
        </FormCard>

        <div className="card" style={{ borderColor: 'var(--danger)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--danger)' }}>Zona de risco</h3>
          </div>
          <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Excluir a conta</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                Cancela a assinatura e marca a conta para remoção. A purga definitiva dos dados é feita manualmente pela nossa equipe, não é instantânea.
              </div>
            </div>
            <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm">Excluir conta</button>
          </div>
        </div>
      </SettingsLayout>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setConfirmName(''); setDeleteError(''); }} title={`Excluir ${company.name}?`} desc="Cancela a assinatura e agenda a remoção dos dados. Irreversível." width={460}
        footer={<>
          <button onClick={() => { setDeleteOpen(false); setConfirmName(''); setDeleteError(''); }} className="btn btn-ghost">Cancelar</button>
          <button onClick={confirmDelete} disabled={deletePending || confirmName.trim() !== company.name.trim()} className="btn btn-danger">{deletePending ? 'Excluindo…' : 'Excluir permanentemente'}</button>
        </>}>
        <div style={{ padding: '12px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 8, display: 'flex', gap: 11 }}>
          <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }}><I.Alert size={15} /></span>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            A conta é cancelada imediatamente e sua sessão é encerrada. Exporte seus dados antes — a remoção definitiva não tem volta.
          </div>
        </div>
        <Field label="Digite o nome da loja para confirmar" required>
          <TextInput value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={company.name} />
        </Field>
        {deleteError && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{deleteError}</div>}
      </Modal>
    </StoreShell>
  );
}
