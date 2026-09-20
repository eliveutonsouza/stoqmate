"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

export function AcceptInvite() {
  const navigate = useNavigate();
  const [name, setName] = React.useState('Diego Castro');
  const [pwd, setPwd] = React.useState('');
  const valid = name.trim().length >= 3 && pwd.length >= 8;

  return (
    <AuthShell navigate={navigate} aside={(
      <div style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Seu perfil de acesso
        </div>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 6 }}>Vendedor</div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          Em Bonsucesso Varejo · Loja Centro. O proprietário pode mudar seu perfil depois.
        </p>
        {[
          ['Registrar vendas, trocas e devoluções', true],
          ['Consultar saldo de todas as unidades', true],
          ['Aplicar desconto até 20%', true],
          ['Cadastrar ou editar produtos', false],
          ['Ver relatórios e custos', false],
          ['Ajustar inventário', false],
        ].map(([l, on]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ color: on ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex', flexShrink: 0 }}>
              {on ? <I.Check size={13} stroke={2.2} /> : <I.X size={13} />}
            </span>
            <span style={{ fontSize: 13, color: on ? 'var(--fg)' : 'var(--fg-muted)' }}>{l}</span>
          </div>
        ))}
      </div>
    )}>
      <span className="badge badge-accent" style={{ marginBottom: 14 }}><I.Users size={11} /> Convite</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
        Mariana convidou você para o Stoqmate
      </h1>
      <p style={{ margin: '10px 0 28px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
        Para entrar em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Bonsucesso Varejo</strong> como Vendedor.
        Defina seu nome e sua senha para começar.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email" hint="Definido pelo convite — não pode ser alterado aqui.">
          <TextInput value="diego@bonsucesso.com.br" readOnly style={{ height: 36, background: 'var(--bg-sunken)' }} />
        </Field>
        <Field label="Seu nome completo" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Diego Castro" style={{ height: 36 }} />
        </Field>
        <Field label="Criar senha" required hint="Mínimo 8 caracteres.">
          <TextInput type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" style={{ height: 36 }} />
        </Field>
        <label style={{ display: 'flex', gap: 9, fontSize: 12, color: 'var(--fg-muted)', alignItems: 'flex-start', lineHeight: 1.5 }}>
          <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
          <span>Concordo com os <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Termos de uso</a> e com a <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Política de privacidade</a>.</span>
        </label>
        <button onClick={() => valid && navigate('/dashboard')} className="btn btn-primary btn-lg" disabled={!valid}
          style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}>
          Aceitar convite e entrar
        </button>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 4 }}>
          Convite enviado em 13 de setembro · expira em 2 dias
        </div>
      </div>
    </AuthShell>
  );
}

// === /checkout ===
