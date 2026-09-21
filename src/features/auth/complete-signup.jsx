"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { PLANS } from '@/lib/plans';
import { completeGoogleSignupAction } from '@/features/auth/actions';

export function CompleteSignup({ email = '' }) {
  const navigate = useNavigate();
  const [storeName, setStoreName] = React.useState('');
  const [cnpj, setCnpj] = React.useState('');
  const [plan, setPlan] = React.useState('controle');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const submit = () => {
    setError('');
    if (!storeName.trim()) { setError('Informe o nome da loja.'); return; }
    startTransition(async () => {
      const result = await completeGoogleSignupAction({ storeName, cnpj, planId: plan });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Falta só a sua loja</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        {email ? `Você entrou como ${email}. ` : ''}Precisamos do nome da loja e do plano pra criar seu espaço.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome da loja">
          <TextInput value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Mercado do Bairro" />
        </Field>
        <Field label="CNPJ (opcional)">
          <TextInput value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>

        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Escolha seu plano</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANS.map(p => {
              const active = plan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: active ? 'var(--accent-soft)' : 'var(--bg-raised)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>R$ {p.monthly}/mês</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={pending} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Criando sua loja…' : 'Criar minha loja'}
        </button>
      </div>
    </AuthShell>
  );
}
