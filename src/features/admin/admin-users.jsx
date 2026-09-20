"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { invitePlatformStaffAction } from '@/features/admin/actions';

const ROLE_LABELS = { super_admin: 'Super Admin', suporte: 'Suporte', engenharia: 'Engenharia', comercial: 'Comercial' };

function timeAgo(iso) {
  if (!iso) return 'nunca';
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function AdminUsers({ staff, auditLog }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [f, setF] = React.useState({ name: '', email: '', role: 'suporte' });
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    if (!f.name.trim() || !f.email.trim()) { setError('Preencha nome e email.'); return; }
    startTransition(async () => {
      const result = await invitePlatformStaffAction(f);
      if (result?.error) { setError(result.error); return; }
      setInviteOpen(false);
      setF({ name: '', email: '', role: 'suporte' });
      router.refresh();
    });
  };

  return (
    <AdminShell breadcrumb={['Usuários']} navigate={navigate}>
      <PageHeader
        title="Usuários da plataforma"
        sub={`${staff.length} administradores · toda ação é registrada no log de auditoria`}
        actions={<button onClick={() => setInviteOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Convidar administrador</button>}
      />
      <Page>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Administradores</h3>
          </div>
          {staff.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum administrador cadastrado ainda.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Administrador</th><th>Função</th><th>2FA</th><th>Último acesso</th></tr></thead>
              <tbody>
                {staff.map((a) => (
                  <tr key={a.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: a.role === 'super_admin' ? 'var(--fg)' : 'var(--bg-sunken)',
                          color: a.role === 'super_admin' ? 'var(--bg)' : 'var(--fg-muted)',
                          border: a.role === 'super_admin' ? 'none' : '1px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 600, flexShrink: 0,
                        }}>{(a.email || '?').slice(0, 2).toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-soft)' }}>{a.email}</div>
                      </div>
                    </td>
                    <td>
                      {a.role === 'super_admin'
                        ? <span className="badge badge-accent"><I.Shield size={10} /> {ROLE_LABELS[a.role]}</span>
                        : <span className="badge">{ROLE_LABELS[a.role] ?? a.role}</span>}
                    </td>
                    <td>
                      {a.mfa_required
                        ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Obrigatório</span>
                        : <span className="badge badge-warning"><I.Alert size={10} /> Opcional</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{timeAgo(a.lastSignInAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Log de auditoria</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ações administrativas sobre redes de clientes.</p>
          </div>
          {auditLog.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum registro ainda.</div>
          ) : (
            <table className="table">
              <thead><tr><th style={{ width: 140 }}>Quando</th><th style={{ width: 150 }}>Quem</th><th>Ação</th><th>Rede</th></tr></thead>
              <tbody>
                {auditLog.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{new Date(a.created_at).toLocaleString('pt-BR')}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{a.who}</td>
                    <td style={{ fontSize: 13 }}>{a.message}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{a.tenantName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Page>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar administrador" desc="Acesso ao console exige 2FA obrigatório." width={460}
        footer={<><button onClick={() => setInviteOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Enviando…' : 'Enviar convite'}</button></>}>
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}
        <Field label="Nome completo" required><TextInput value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="Nome do administrador" /></Field>
        <Field label="Email" required><TextInput type="email" value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} placeholder="nome@empresa.com.br" /></Field>
        <Field label="Função" required>
          <SelectInput value={f.role} onChange={(v) => setF((s) => ({ ...s, role: v }))}
            options={[{ value: 'super_admin', label: 'Super Admin' }, { value: 'suporte', label: 'Suporte' }, { value: 'engenharia', label: 'Engenharia' }, { value: 'comercial', label: 'Comercial' }]} />
        </Field>
        <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          O convite vai por email (Supabase Auth). A pessoa cadastra a própria senha e o 2FA no primeiro acesso.
        </div>
      </Modal>
    </AdminShell>
  );
}
