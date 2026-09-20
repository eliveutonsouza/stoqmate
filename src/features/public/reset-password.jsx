"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { resetPasswordAction } from '@/features/auth/actions';

export function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const checks = [
    { l: 'Mínimo 8 caracteres', ok: pwd.length >= 8 },
    { l: 'As duas senhas conferem', ok: pwd.length > 0 && pwd === confirm },
  ];
  const strength = checks.filter(c => c.ok).length;
  const valid = strength === checks.length;

  const submit = () => {
    setError('');
    startTransition(async () => {
      const result = await resetPasswordAction({ password: pwd });
      if (result?.error) setError('Link expirado ou inválido. Peça um novo em "Esqueci a senha".');
      else setDone(true);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      {done ? (
        <>
          <div style={{
            width: 40, height: 40, borderRadius: 9,
            background: 'var(--success-soft)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}><I.Check size={20} stroke={2} /></div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>Senha redefinida</h1>
          <p style={{ margin: '10px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Suas outras sessões foram encerradas por segurança. Entre de novo com a senha nova.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">Ir para o login</button>
        </>
      ) : (
        <>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Definir nova senha</h1>
          <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Escolha uma nova senha pra sua conta.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nova senha" required>
              <TextInput type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" style={{ height: 36 }} />
            </Field>
            <Field label="Confirmar nova senha" required
              error={confirm.length > 0 && pwd !== confirm ? 'As senhas não conferem.' : null}>
              <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" style={{ height: 36 }} />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {checks.map(c => (
                <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: c.ok ? 'var(--success)' : 'var(--fg-muted)' }}>
                  {c.ok ? <I.Check size={12} stroke={2.4} /> : <span style={{ width: 12, textAlign: 'center' }}>·</span>}
                  {c.l}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
                {error}
              </div>
            )}

            <button onClick={submit} className="btn btn-primary btn-lg" disabled={!valid || pending}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: valid && !pending ? 1 : 0.45, cursor: valid && !pending ? 'pointer' : 'not-allowed' }}>
              {pending ? 'Salvando…' : 'Redefinir senha'}
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 4 }}>
              ← Voltar ao login
            </a>
          </div>
        </>
      )}
    </AuthShell>
  );
}

// === /invite ===
