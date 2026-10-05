"use client";

import * as React from 'react';
import { Suspense } from 'react';
import { unstable_rethrow, useSearchParams } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { createClient } from '@/lib/supabase/client';
import { acceptInviteAction } from '@/features/auth/actions';
import { ROLES } from '@/lib/permissions';

const ROLE_NAME = Object.fromEntries(ROLES.map(r => [r.id, r.name]));

function AcceptInviteInner() {
  const navigate = useNavigate();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [status, setStatus] = React.useState(() => (token ? 'loading' : 'invalid')); // loading|valid|invalid|error
  const [attempt, setAttempt] = React.useState(0);
  const [preview, setPreview] = React.useState(null);
  const [name, setName] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const valid = name.trim().length >= 3 && pwd.length >= 8;

  React.useEffect(() => {
    if (!token) return;
    // Falha de rede/servidor não é convite inválido: só "sem linha" é.
    createClient().rpc('fn_invite_preview', { p_token: token }).then(({ data, error: rpcError }) => {
      if (rpcError) { setStatus('error'); return; }
      if (!data?.length) { setStatus('invalid'); return; }
      setPreview(data[0]);
      setStatus('valid');
    }).catch(() => setStatus('error'));
  }, [token, attempt]);

  const retry = () => { setStatus('loading'); setAttempt((n) => n + 1); };

  const submit = () => {
    if (!valid) return;
    setError('');
    startTransition(async () => {
      try {
        const result = await acceptInviteAction({ token, email: preview.email, fullName: name, password: pwd });
        if (result?.error) setError(result.error);
      } catch (e) {
        unstable_rethrow(e); // redirect() do Next sobe como exceção — deixa passar.
        setError('Não foi possível concluir. Verifique a conexão e tente de novo.');
      }
    });
  };

  if (status === 'loading') {
    return <AuthShell navigate={navigate}><p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>Carregando convite…</p></AuthShell>;
  }
  if (status === 'error') {
    return (
      <AuthShell navigate={navigate}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>Não foi possível carregar o convite</h1>
        <p role="alert" style={{ margin: '10px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          Falha de conexão ao verificar o link. O convite pode continuar válido — tente de novo em instantes.
        </p>
        <button onClick={retry} className="btn btn-primary">Tentar de novo</button>
      </AuthShell>
    );
  }
  if (status === 'invalid') {
    return (
      <AuthShell navigate={navigate}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>Convite inválido</h1>
        <p style={{ margin: '10px 0 24px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          Este link já foi usado, expirou ou não existe. Peça pra quem te convidou enviar um novo.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">Ir para o login</button>
      </AuthShell>
    );
  }

  const roleDesc = ROLES.find(r => r.id === preview.role)?.desc;

  return (
    <AuthShell navigate={navigate} aside={(
      <div style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Seu perfil de acesso
        </div>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 6 }}>{ROLE_NAME[preview.role]}</div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          Em {preview.tenant_name}. {roleDesc} O proprietário pode mudar seu perfil depois.
        </p>
      </div>
    )}>
      <span className="badge badge-accent" style={{ marginBottom: 14 }}><I.Users size={11} /> Convite</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
        Você foi convidado para o Stoqmate
      </h1>
      <p style={{ margin: '10px 0 28px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
        Para entrar em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{preview.tenant_name}</strong> como {ROLE_NAME[preview.role]}.
        Defina seu nome e sua senha para começar.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email" hint="Definido pelo convite — não pode ser alterado aqui.">
          <TextInput value={preview.email} readOnly style={{ height: 36, background: 'var(--bg-sunken)' }} />
        </Field>
        <Field label="Seu nome completo" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Diego Castro" style={{ height: 36 }} />
        </Field>
        <Field label="Criar senha" required hint="Mínimo 8 caracteres, com letras e números.">
          <TextInput type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" style={{ height: 36 }} />
        </Field>
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
        <button onClick={submit} className="btn btn-primary btn-lg" disabled={!valid || pending}
          style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: valid && !pending ? 1 : 0.45, cursor: valid && !pending ? 'pointer' : 'not-allowed' }}>
          {pending ? 'Entrando…' : 'Aceitar convite e entrar'}
        </button>
      </div>
    </AuthShell>
  );
}

export function AcceptInvite() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<AuthShell navigate={navigate}><p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>Carregando…</p></AuthShell>}>
      <AcceptInviteInner />
    </Suspense>
  );
}

// === /checkout ===
