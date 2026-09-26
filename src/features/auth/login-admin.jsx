"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthAdminAside } from '@/features/auth/auth-admin-aside';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { signInAdminAction } from '@/features/auth/actions';

export function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    startTransition(async () => {
      const result = await signInAdminAction({ email, password, code: code.replace(/\s/g, '') });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthAdminAside />}>
      <span className="badge badge-accent" style={{ marginBottom: 14 }}><I.Shield size={11} /> Console da plataforma</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Acesso administrativo</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        Restrito à equipe Stoqmate. Toda sessão é auditada.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email corporativo">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 36 }} />
        </Field>
        <Field label="Senha">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 36 }} />
        </Field>
        <Field label="Código 2FA" hint="6 dígitos do app autenticador">
          <TextInput mono placeholder="000 000" value={code} onChange={(e) => setCode(e.target.value)} style={{ height: 36, letterSpacing: '0.2em' }} />
        </Field>
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Verificando…' : 'Entrar no console'}
        </button>
        <a href="/login" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/login'); }} style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 8 }}>
          ← Voltar ao login de loja
        </a>
      </form>
    </AuthShell>
  );
}
