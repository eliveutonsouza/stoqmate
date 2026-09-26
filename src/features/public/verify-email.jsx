"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { resendConfirmationAction } from '@/features/auth/actions';

const COOLDOWN_S = 60;

export function VerifyEmail({ email = '' }) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = React.useState(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await resendConfirmationAction({ email });
      if (result?.error) { setFeedback({ tone: 'danger', text: result.error }); return; }
      setFeedback({ tone: 'success', text: 'Link reenviado. Confira a caixa de entrada.' });
      setCooldown(COOLDOWN_S);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <span className="badge badge-info" style={{ marginBottom: 14 }}>Passo 2 de 3</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Confirme seu email</h1>
      <p style={{ margin: '8px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
        Enviamos um link para {email ? <strong style={{ color: 'var(--fg)' }}>{email}</strong> : 'o seu email'}.
        Sua loja é criada assim que você clicar nele.
      </p>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55, marginBottom: 20 }}>
        Não chegou em 2 minutos? Veja em spam ou promoções. Se esse email já tinha conta confirmada, é só entrar.
      </div>
      {feedback && (
        <div style={{ padding: '10px 13px', background: `var(--${feedback.tone}-soft)`, border: `1px solid var(--${feedback.tone})`, borderRadius: 7, fontSize: 12.5, marginBottom: 14 }}>
          {feedback.text}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/login')} className="btn btn-primary">Já confirmei, entrar</button>
        <button onClick={resend} disabled={!email || pending || cooldown > 0} className="btn btn-outline">
          {pending ? 'Reenviando…' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar link'}
        </button>
      </div>
      <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>
        Email errado? <a href="/signup" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/signup'); }}>Cadastrar de novo</a>.
      </div>
    </AuthShell>
  );
}
