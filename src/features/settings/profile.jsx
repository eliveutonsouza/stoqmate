"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { signOutAction } from '@/features/auth/actions';

export function Profile() {
  const navigate = useNavigate();
  const sessions = [
    { device: 'MacBook Pro · Chrome', place: 'São Paulo, BR', ip: '177.42.18.204', last: 'esta sessão', current: true },
    { device: 'iPhone 15 · Safari', place: 'São Paulo, BR', ip: '177.42.18.204', last: 'há 3 h' },
    { device: 'Terminal do balcão · Loja Centro', place: 'São Paulo, BR', ip: '192.168.0.42', last: 'ontem' },
  ];
  return (
    <StoreShell route="/profile" breadcrumb={['Meu perfil']} navigate={navigate}>
      <PageHeader title="Meu perfil" sub="Seus dados de acesso e sessões ativas." />
      <SettingsLayout route="/profile" navigate={navigate}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-strong)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 600, flexShrink: 0,
          }}>AR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>Ana Ribeiro</div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>ana@bonsucesso.com.br</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="badge badge-accent">Gestora de Estoque</span>
              <span className="badge">Bonsucesso Varejo · Loja Centro</span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm">Trocar foto</button>
        </div>

        <FormCard title="Dados pessoais" cols={2}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          <Field label="Nome completo" span={2}><TextInput defaultValue="Ana Ribeiro" /></Field>
          <Field label="Email" span={1} hint="Usado para login e notificações."><TextInput type="email" defaultValue="ana@bonsucesso.com.br" /></Field>
          <Field label="Telefone" span={1}><TextInput mono defaultValue="(11) 97777-2211" /></Field>
        </FormCard>

        <FormCard title="Segurança" cols={2}
          footer={<button className="btn btn-primary">Atualizar senha</button>}>
          <Field label="Senha atual" span={2}><TextInput type="password" placeholder="••••••••" /></Field>
          <Field label="Nova senha" span={1} hint="Mínimo 8 caracteres."><TextInput type="password" placeholder="••••••••" /></Field>
          <Field label="Confirmar nova senha" span={1}><TextInput type="password" placeholder="••••••••" /></Field>
          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6, borderTop: '1px solid var(--line-soft)', marginTop: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Verificação em duas etapas</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Exige código do app autenticador a cada novo dispositivo.</div>
            </div>
            <span className="badge">Desativada</span>
            <button className="btn btn-outline btn-sm">Ativar</button>
          </div>
        </FormCard>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Sessões ativas</h3>
            <button className="btn btn-outline btn-sm">Encerrar todas as outras</button>
          </div>
          {sessions.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 18px',
              borderBottom: i < sessions.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.device}
                  {s.current && <span className="badge badge-success"><span className="badge-dot"></span> Atual</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{s.place} · {s.ip}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.last}</span>
              {!s.current && <button className="btn btn-ghost btn-sm">Encerrar</button>}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Sair da conta</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Encerra esta sessão neste dispositivo.</div>
          </div>
          <button onClick={() => signOutAction()} className="btn btn-outline btn-sm"><I.Logout size={12} /> Sair</button>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
