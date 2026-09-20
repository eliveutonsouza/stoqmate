"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { signInAction } from '@/features/auth/actions';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    startTransition(async () => {
      const result = await signInAction({ email, password });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Entrar na sua conta</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Criar loja grátis</a>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <TextInput type="email" placeholder="voce@sualoja.com.br" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 36 }} />
        </Field>
        <Field label="Senha">
          <TextInput type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 36 }} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-muted)' }}>
            <input type="checkbox" defaultChecked /> Manter conectado
          </label>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 500 }}>Esqueci a senha</a>
        </div>
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
        <button onClick={submit} disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
          <span style={{ fontSize: 11, color: 'var(--fg-soft)' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
        </div>
        {/* TODO (deferido): habilitar quando houver Client ID/Secret do Google Cloud (OAuth) */}
        <button disabled title="Em breve" className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: 0.55, cursor: 'not-allowed' }}>Entrar com Google</button>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/admin'); }} style={{
          fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <I.Shield size={12} /> Acesso administrativo da plataforma
        </a>
      </div>
    </AuthShell>
  );
}
