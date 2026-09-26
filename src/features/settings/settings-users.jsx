"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { ROLES } from '@/lib/permissions';
import {
  inviteTeamMemberAction,
  setTeamRoleAction,
  removeTeamMemberAction,
  cancelInviteAction,
} from '@/features/settings/actions';

const ROLE_NAME = Object.fromEntries(ROLES.map(r => [r.id, r.name]));
const ROLE_DESC = Object.fromEntries(ROLES.map(r => [r.id, r.desc]));
// Proprietário fica fora: transferir a titularidade da rede não é "convidar".
const INVITABLE = ROLES.filter(r => r.id !== 'proprietario');

function initialsOf(member) {
  if (member.initials) return member.initials;
  const base = member.full_name || member.email || '?';
  return base.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function lastSeen(iso) {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  if (mins < 1440) return `há ${Math.floor(mins / 60)} h`;
  return `há ${Math.floor(mins / 1440)} d`;
}

/**
 * @param {{
 *   members?: Array<any>,
 *   invites?: Array<any>,
 *   planName?: string,
 *   seatLimit?: number,
 *   seatsUsed?: number,
 * }} props
 */
export function SettingsUsers({ members = [], invites = [], planName = '—', seatLimit = 0, seatsUsed = 0, currentUserId = null }) {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: '', email: '', role: 'vendedor' });
  const [error, setError] = React.useState('');
  const [inviteLink, setInviteLink] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const closeInvite = () => { setInviteOpen(false); setError(''); setInviteLink(''); setCopied(false); setForm({ fullName: '', email: '', role: 'vendedor' }); };

  const submitInvite = () => {
    setError('');
    startTransition(async () => {
      const result = await inviteTeamMemberAction(form);
      if (result?.error) { setError(result.error); return; }
      setInviteLink(`${window.location.origin}/invite?token=${result.token}`);
    });
  };

  const run = (fn) => startTransition(async () => {
    setError('');
    const result = await fn();
    if (result?.error) setError(result.error);
  });

  const seatsLabel = seatLimit > 0
    ? `${seatsUsed} de ${seatLimit} usuários do plano ${planName} utilizados.`
    : `${seatsUsed} usuários. O plano ${planName} não limita assentos.`;

  return (
    <StoreShell route="/settings/users" breadcrumb={['Configurações', 'Usuários']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/users" navigate={navigate}>
        {error && (
          <div style={{ padding: '10px 13px', marginBottom: 12, background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Equipe</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{seatsLabel}</p>
            </div>
            <button onClick={() => setInviteOpen(true)} disabled={pending} className="btn btn-primary btn-sm"><I.Plus size={12} /> Convidar usuário</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.user_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: u.role === 'proprietario' ? 'var(--accent-strong)' : 'var(--bg-sunken)',
                        color: u.role === 'proprietario' ? '#fff' : 'var(--fg-muted)',
                        border: u.role === 'proprietario' ? 'none' : '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}>{initialsOf(u)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <SelectInput
                      value={ROLE_NAME[u.role] ?? u.role}
                      onChange={(name) => {
                        const next = ROLES.find(r => r.name === name);
                        if (next && next.id !== u.role) run(() => setTeamRoleAction(u.user_id, next.id));
                      }}
                      options={ROLES.map(r => r.name)}
                    />
                    <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 3 }}>{ROLE_DESC[u.role]}</div>
                  </td>
                  <td><span className="badge badge-success"><span className="badge-dot"></span> Ativo</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{lastSeen(u.last_sign_in_at)}</td>
                  <td>
                    {/* Ninguém se remove (o banco recusa); mostrar o botão só gerava erro. */}
                    {u.user_id === currentUserId
                      ? <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Você</span>
                      : <button onClick={() => run(() => removeTeamMemberAction(u.user_id))} disabled={pending} className="btn btn-ghost btn-sm">Remover</button>}
                  </td>
                </tr>
              ))}
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-sunken)',
                        border: '1px solid var(--line)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0,
                      }}><I.Users size={12} /></div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{inv.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><div style={{ fontSize: 12, fontWeight: 500 }}>{ROLE_NAME[inv.role] ?? inv.role}</div></td>
                  <td><span className="badge badge-info">Convite pendente</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</td>
                  <td>
                    <button onClick={() => run(() => cancelInviteAction(inv.id))} disabled={pending} className="btn btn-ghost btn-sm">Cancelar</button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && invites.length === 0 && (
                <tr><td colSpan={5} style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '18px' }}>Nenhum usuário ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <FormCard title="Perfis de acesso" desc="Permissões fixas por perfil, conforme a hierarquia do sistema." cols={1}>
          {ROLES.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < ROLES.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ width: 150, flexShrink: 0, fontSize: 13, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </FormCard>
      </SettingsLayout>

      <Modal open={inviteOpen} onClose={closeInvite} title="Convidar usuário" desc="O convite expira em 7 dias." width={460}
        footer={inviteLink
          ? <button onClick={closeInvite} className="btn btn-primary">Concluir</button>
          : <><button onClick={closeInvite} className="btn btn-ghost">Cancelar</button><button onClick={submitInvite} disabled={pending} className="btn btn-primary">{pending ? 'Criando…' : 'Criar convite'}</button></>}>
        {inviteLink ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Convite criado. <strong style={{ color: 'var(--fg)' }}>O envio automático por email ainda não está ativo</strong> — copie o link abaixo e mande para a pessoa.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><TextInput readOnly value={inviteLink} onFocus={(e) => e.target.select()} /></div>
              <button type="button" className="btn btn-outline btn-sm"
                onClick={() => navigator.clipboard?.writeText(inviteLink).then(() => setCopied(true), () => setCopied(false))}>
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Field label="Nome completo" required>
              <TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Diego Castro" />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="diego@exemplo.com.br" />
            </Field>
            <Field label="Perfil de acesso" required hint="Define o que a pessoa pode ver e fazer.">
              <SelectInput
                value={ROLE_NAME[form.role]}
                onChange={(name) => {
                  const next = INVITABLE.find(r => r.name === name);
                  if (next) setForm({ ...form, role: next.id });
                }}
                options={INVITABLE.map(r => r.name)}
              />
            </Field>
            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{ROLE_NAME[form.role]}:</strong> {ROLE_DESC[form.role]}
            </div>
          </>
        )}
      </Modal>
    </StoreShell>
  );
}
