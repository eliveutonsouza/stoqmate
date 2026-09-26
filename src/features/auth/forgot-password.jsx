"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { forgotPasswordAction } from '@/features/auth/actions';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    startTransition(async () => {
      const result = await forgotPasswordAction({ email }).catch(() => ({ error: 'Não foi possível enviar agora. Tente de novo em instantes.' }));
      if (result?.error) { setError(result.error); setSent(false); return; }
      setSent(true);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      {!sent ? (
        <>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Recuperar senha</h1>
          <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
            Informe o email da conta e enviaremos um link de redefinição válido por 1 hora.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Email">
              <TextInput type="email" placeholder="voce@sualoja.com.br" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 36 }} />
            </Field>
            {error && (
              <div role="alert" style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>{error}</div>
            )}
            <button type="submit" disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
              {pending ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>
            <a href="/login" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/login'); }} style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 6 }}>
              ← Voltar ao login
            </a>
          </form>
        </>
      ) : (
        <>
          <div style={{
            width: 40, height: 40, borderRadius: 9,
            background: 'var(--success-soft)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}><I.Check size={20} stroke={2} /></div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>Link enviado</h1>
          <p style={{ margin: '10px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Se existir uma conta com esse email, o link de redefinição chegou na caixa de entrada. Verifique também o spam.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary">Voltar ao login</button>
            <button onClick={() => setSent(false)} className="btn btn-outline">Reenviar</button>
          </div>
        </>
      )}
    </AuthShell>
  );
}
