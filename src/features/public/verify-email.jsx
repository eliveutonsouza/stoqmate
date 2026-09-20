"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(false);
  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <span className="badge badge-info" style={{ marginBottom: 14 }}>Passo 2 de 3</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Confirme seu email</h1>
      <p style={{ margin: '8px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
        Enviamos um link para <strong style={{ color: 'var(--fg)' }}>mariana@bonsucesso.com.br</strong>.
        É o que garante que só você recupera a senha e recebe os avisos de estoque.
      </p>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55, marginBottom: 20 }}>
        Não chegou em 2 minutos? Veja em spam ou promoções. O link vale por 24 horas.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/onboarding')} className="btn btn-primary">Já confirmei, continuar</button>
        <button onClick={() => setSent(true)} className="btn btn-outline">{sent ? 'Link reenviado' : 'Reenviar link'}</button>
      </div>
      <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>
        Email errado? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Corrigir endereço</a>.
      </div>
    </AuthShell>
  );
}
