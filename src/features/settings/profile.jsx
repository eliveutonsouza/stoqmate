"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { signOutAction } from '@/features/auth/actions';
import { useShell } from '@/components/layout/shell-context';
import {
  updateProfileAction, uploadAvatarAction, changePasswordAction,
  enrollMfaAction, verifyMfaAction, unenrollMfaAction,
} from '@/features/settings/actions';

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function Profile({ profile }) {
  const navigate = useNavigate();
  const shellSignOut = useShell()?.actions?.signOut;
  const [fullName, setFullName] = React.useState(profile?.fullName ?? '');
  const [phone, setPhone] = React.useState(profile?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = React.useState(null);
  const [profileError, setProfileError] = React.useState('');
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [profilePending, startProfileTransition] = React.useTransition();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSaved, setPasswordSaved] = React.useState(false);
  const [passwordPending, startPasswordTransition] = React.useTransition();

  const [mfaEnabled, setMfaEnabled] = React.useState(profile?.mfaEnabled ?? false);
  const [mfaEnrollment, setMfaEnrollment] = React.useState(null);
  const [mfaCode, setMfaCode] = React.useState('');
  const [mfaError, setMfaError] = React.useState('');
  const [mfaPending, startMfaTransition] = React.useTransition();

  if (!profile) {
    return (
      <StoreShell route="/profile" breadcrumb={['Meu perfil']} navigate={navigate}>
        <PageHeader title="Meu perfil" />
        <SettingsLayout route="/profile" navigate={navigate}>
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>Sessão expirada.</div>
        </SettingsLayout>
      </StoreShell>
    );
  }

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const saveProfile = () => {
    setProfileError(''); setProfileSaved(false);
    startProfileTransition(async () => {
      let url = profile.avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadResult = await uploadAvatarAction(formData);
        if (uploadResult?.error) { setProfileError(uploadResult.error); return; }
        url = uploadResult.url;
      }
      const result = await updateProfileAction({ fullName, phone, avatarUrl: url });
      if (result?.error) { setProfileError(result.error); return; }
      setProfileSaved(true);
    });
  };

  const savePassword = () => {
    setPasswordError(''); setPasswordSaved(false);
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não coincidem.'); return; }
    startPasswordTransition(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (result?.error) { setPasswordError(result.error); return; }
      setPasswordSaved(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    });
  };

  const startMfaEnroll = () => {
    setMfaError('');
    startMfaTransition(async () => {
      const result = await enrollMfaAction();
      if (result?.error) { setMfaError(result.error); return; }
      setMfaEnrollment(result);
    });
  };

  const confirmMfa = () => {
    setMfaError('');
    startMfaTransition(async () => {
      const result = await verifyMfaAction({ factorId: mfaEnrollment.factorId, code: mfaCode });
      if (result?.error) { setMfaError(result.error); return; }
      setMfaEnabled(true);
      setMfaEnrollment(null);
      setMfaCode('');
    });
  };

  const cancelMfaEnroll = () => {
    const factorId = mfaEnrollment?.factorId;
    setMfaEnrollment(null);
    setMfaCode('');
    setMfaError('');
    if (factorId) startMfaTransition(async () => { await unenrollMfaAction(factorId); });
  };

  const disableMfa = () => {
    setMfaError('');
    startMfaTransition(async () => {
      const result = await unenrollMfaAction(mfaEnrollment?.factorId ?? profile.mfaFactorId);
      if (result?.error) { setMfaError(result.error); return; }
      setMfaEnabled(false);
    });
  };

  return (
    <StoreShell route="/profile" breadcrumb={['Meu perfil']} navigate={navigate}>
      <PageHeader title="Meu perfil" sub="Seus dados de acesso e segurança da conta." />
      <SettingsLayout route="/profile" navigate={navigate}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--accent-strong)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 600, flexShrink: 0,
            }}>{initialsOf(fullName)}</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>{fullName || 'Sem nome'}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>{profile.email}</div>
          </div>
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            Trocar foto
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>

        <FormCard title="Dados pessoais" cols={2}
          footer={<button onClick={saveProfile} disabled={profilePending} className="btn btn-primary">{profilePending ? 'Salvando…' : 'Salvar alterações'}</button>}>
          <Field label="Nome completo" span={2}><TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="Email" span={1} hint="Não editável por aqui — fale com o suporte para trocar."><TextInput type="email" value={profile.email} disabled /></Field>
          <Field label="Telefone" span={1}><TextInput mono value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          {profileError && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--danger)' }}>{profileError}</div>}
          {profileSaved && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--success)' }}>Perfil atualizado.</div>}
        </FormCard>

        <FormCard title="Segurança" cols={2}
          footer={<button onClick={savePassword} disabled={passwordPending} className="btn btn-primary">{passwordPending ? 'Atualizando…' : 'Atualizar senha'}</button>}>
          <Field label="Senha atual" span={2}><TextInput type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" /></Field>
          <Field label="Nova senha" span={1} hint="Mínimo 8 caracteres."><TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></Field>
          <Field label="Confirmar nova senha" span={1}><TextInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" /></Field>
          {passwordError && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--danger)' }}>{passwordError}</div>}
          {passwordSaved && <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--success)' }}>Senha atualizada.</div>}

          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6, borderTop: '1px solid var(--line-soft)', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Verificação em duas etapas</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Exige código do app autenticador a cada novo dispositivo.</div>
              </div>
              <span className={mfaEnabled ? 'badge badge-success' : 'badge'}>{mfaEnabled ? 'Ativada' : 'Desativada'}</span>
              {mfaEnabled ? (
                <button onClick={disableMfa} disabled={mfaPending} className="btn btn-outline btn-sm">Desativar</button>
              ) : !mfaEnrollment ? (
                <button onClick={startMfaEnroll} disabled={mfaPending} className="btn btn-outline btn-sm">Ativar</button>
              ) : null}
            </div>
            {mfaEnrollment && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12, background: 'var(--bg-sunken)', borderRadius: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mfaEnrollment.qrCode} alt="QR code TOTP" style={{ width: 120, height: 120, background: '#fff', borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>
                    Escaneie com o app autenticador e digite o código de 6 dígitos.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextInput mono value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000000" style={{ width: 120 }} />
                    <button onClick={confirmMfa} disabled={mfaPending || mfaCode.length < 6} className="btn btn-primary btn-sm">Confirmar</button>
                    <button type="button" onClick={cancelMfaEnroll} disabled={mfaPending} className="btn btn-ghost btn-sm">Cancelar</button>
                  </div>
                  {mfaEnrollment.secret && (
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 8 }}>
                      Sem câmera? Digite esta chave no app: <code style={{ fontFamily: 'var(--font-mono)', userSelect: 'all' }}>{mfaEnrollment.secret}</code>
                    </div>
                  )}
                </div>
              </div>
            )}
            {mfaError && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{mfaError}</div>}
          </div>
        </FormCard>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Sair da conta</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Encerra esta sessão neste dispositivo.</div>
          </div>
          <button onClick={() => (shellSignOut ?? signOutAction)()} className="btn btn-outline btn-sm"><I.Logout size={12} /> Sair</button>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
