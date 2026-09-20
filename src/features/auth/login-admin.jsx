"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthAdminAside } from '@/features/auth/auth-admin-aside';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

export function LoginAdmin() {
  const navigate = useNavigate();
  return (
    <AuthShell navigate={navigate} aside={<AuthAdminAside />}>
      <span className="badge badge-accent" style={{ marginBottom: 14 }}><I.Shield size={11} /> Console da plataforma</span>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Acesso administrativo</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        Restrito à equipe Stoqmate. Toda sessão é auditada.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email corporativo">
          <TextInput type="email" defaultValue="carlos@stoqmate.com.br" style={{ height: 36 }} />
        </Field>
        <Field label="Senha">
          <TextInput type="password" defaultValue="demo1234" style={{ height: 36 }} />
        </Field>
        <Field label="Código 2FA" hint="6 dígitos do app autenticador">
          <TextInput mono placeholder="000 000" defaultValue="428 917" style={{ height: 36, letterSpacing: '0.2em' }} />
        </Field>
        <button onClick={() => navigate('/admin')} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          Entrar no console
        </button>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 8 }}>
          ← Voltar ao login de loja
        </a>
      </div>
    </AuthShell>
  );
}
