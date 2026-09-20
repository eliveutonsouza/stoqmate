"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AuthShell } from '@/features/auth/auth-shell';
import { AuthTestimonial } from '@/features/auth/auth-testimonial';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';

export function Login() {
  const navigate = useNavigate();
  return (
    <AuthShell navigate={navigate} aside={<AuthTestimonial />}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>Entrar na sua conta</h1>
      <p style={{ margin: '8px 0 28px', fontSize: 14, color: 'var(--fg-muted)' }}>
        Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Criar loja grátis</a>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <TextInput type="email" placeholder="ana@bonsucesso.com.br" defaultValue="ana@bonsucesso.com.br" style={{ height: 36 }} />
        </Field>
        <Field label="Senha">
          <TextInput type="password" placeholder="••••••••" defaultValue="demo1234" style={{ height: 36 }} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-muted)' }}>
            <input type="checkbox" defaultChecked /> Manter conectado
          </label>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 500 }}>Esqueci a senha</a>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          Entrar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
          <span style={{ fontSize: 11, color: 'var(--fg-soft)' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}></div>
        </div>
        <button className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center' }}>Entrar com Google</button>
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
