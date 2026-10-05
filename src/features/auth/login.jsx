"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { signInAction, startGoogleSignInAction, verifyLoginMfaAction } from '@/features/auth/actions';

// ?mfa=1 vem do proxy/callback quando a sessão (senha ou Google) ainda não
// passou pelo 2FA. Lido da URL sem efeito: no servidor é sempre false.
const noopSubscribe = () => () => {};
const readMfaFlag = () => new URLSearchParams(window.location.search).get('mfa') === '1';
const serverMfaFlag = () => false;
const nextFromUrl = () => new URLSearchParams(window.location.search).get('next') ?? undefined;

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const mfaFromUrl = React.useSyncExternalStore(noopSubscribe, readMfaFlag, serverMfaFlag);
  const [mfaStep, setMfaStep] = React.useState(false);
  const [code, setCode] = React.useState('');
  const askCode = mfaStep || mfaFromUrl;

  const submit = () => {
    setError('');
    if (!email.trim() || !password) { setError('Informe email e senha.'); return; }
    startTransition(async () => {
      const result = await signInAction({ email, password, next: nextFromUrl() });
      if (result?.mfaRequired) { setMfaStep(true); return; }
      if (result?.error) setError(result.error);
    });
  };

  const submitCode = () => {
    setError('');
    const digits = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(digits)) { setError('Informe os 6 dígitos do app autenticador.'); return; }
    startTransition(async () => {
      const result = await verifyLoginMfaAction({ code: digits, next: nextFromUrl() });
      if (result?.restart) { setMfaStep(false); setCode(''); navigate('/login'); }
      if (result?.error) setError(result.error);
    });
  };

  if (askCode) {
    return (
      <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Verificação em duas etapas</h1>
        <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
          Digite o código de 6 dígitos do seu app autenticador.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); submitCode(); }} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Código 2FA" hint="6 dígitos do app autenticador">
            <TextInput mono inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="000 000" value={code} onChange={(e) => setCode(e.target.value)} style={{ height: 36, letterSpacing: '0.2em' }} />
          </Field>
          {error && (
            <div role="alert" style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pending ? 0.7 : 1 }}>
            {pending ? 'Verificando…' : 'Verificar e entrar'}
          </button>
        </form>
      </AuthShell>
    );
  }

  const google = () => {
    setError('');
    startTransition(async () => {
      const result = await startGoogleSignInAction();
      if (result?.error) { setError(result.error); return; }
      window.location.href = result.url;
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Entrar na sua conta</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        Não tem conta? <a href="/signup" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/signup'); }} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Criar loja grátis</a>
      </p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <TextInput type="email" placeholder="voce@sualoja.com.br" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 36 }} />
        </Field>
        <Field label="Senha">
          <TextInput type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 36 }} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <a href="/forgot-password" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/forgot-password'); }} style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 500 }}>Esqueci a senha</a>
        </div>
        {error && (
          <div role="alert" style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
          <span style={{ fontSize: 11, color: 'var(--fg-soft)' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
        </div>
        <button type="button" onClick={google} disabled={pending} className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>Entrar com Google</button>
      </form>
    </AuthShell>
  );
}
