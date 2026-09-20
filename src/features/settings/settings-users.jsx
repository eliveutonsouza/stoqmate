"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';

export function SettingsUsers() {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const users = [
    { name: 'Mariana Souza', email: 'mariana@bonsucesso.com.br', role: 'Proprietária', initials: 'MS', status: 'active', last: 'agora' },
    { name: 'Ana Ribeiro', email: 'ana@bonsucesso.com.br', role: 'Gestora de Estoque', initials: 'AR', status: 'active', last: 'há 4 min' },
    { name: 'Roberto Lima', email: 'roberto@bonsucesso.com.br', role: 'Gestor Financeiro', initials: 'RL', status: 'active', last: 'ontem' },
    { name: 'Lucas Prado', email: 'lucas@bonsucesso.com.br', role: 'Vendedor', initials: 'LP', status: 'active', last: 'há 12 min' },
    { name: 'Marina Alves', email: 'marina@bonsucesso.com.br', role: 'Vendedor', initials: 'MA', status: 'active', last: 'há 1 h' },
    { name: 'Diego Castro', email: 'diego@bonsucesso.com.br', role: 'Vendedor', initials: 'DC', status: 'invited', last: '—' },
  ];
  const roleDesc = {
    'Proprietária': 'Acesso total + configurações e assinatura',
    'Gestor Financeiro': 'Operação completa + relatórios financeiros',
    'Gestora de Estoque': 'Operação completa, sem relatórios financeiros',
    'Vendedor': 'Vendas, trocas, devoluções e consulta de estoque',
  };

  return (
    <StoreShell route="/settings/users" breadcrumb={['Configurações', 'Usuários']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/users" navigate={navigate}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Equipe</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>6 de 8 usuários do plano Controle utilizados, nas 4 unidades.</p>
            </div>
            <button onClick={() => setInviteOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Convidar usuário</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th style={{ width: 30 }}></th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: u.role === 'Proprietária' ? 'var(--accent-strong)' : 'var(--bg-sunken)',
                        color: u.role === 'Proprietária' ? '#fff' : 'var(--fg-muted)',
                        border: u.role === 'Proprietária' ? 'none' : '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}>{u.initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{u.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{roleDesc[u.role]}</div>
                  </td>
                  <td>
                    {u.status === 'active'
                      ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span>
                      : <span className="badge badge-info">Convite pendente</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{u.last}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <FormCard title="Perfis de acesso" desc="Permissões fixas por perfil, conforme a hierarquia do sistema." cols={1}>
          {[
            ['Proprietário', 'Tudo da rede + branding, usuários e assinatura.'],
            ['Gestor Financeiro', 'Operação completa + relatórios financeiros e exportações.'],
            ['Gestor de Estoque', 'Catálogo, categorias, estoque, transferências, fornecedores e promoções.'],
            ['Vendedor', 'Registrar venda, troca e devolução. Consultar estoque de toda a rede. Sem relatórios nem cadastros.'],
          ].map(([r, d], i, arr) => (
            <div key={r} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ width: 150, flexShrink: 0, fontSize: 13, fontWeight: 500 }}>{r}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </FormCard>
      </SettingsLayout>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar usuário" desc="O convite chega por email e expira em 7 dias." width={460}
        footer={<><button onClick={() => setInviteOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setInviteOpen(false)} className="btn btn-primary">Enviar convite</button></>}>
        <Field label="Nome completo" required><TextInput placeholder="Diego Castro" /></Field>
        <Field label="Email" required><TextInput type="email" placeholder="diego@bonsucesso.com.br" /></Field>
        <Field label="Perfil de acesso" required hint="Define o que a pessoa pode ver e fazer.">
          <SelectInput value="Vendedor" onChange={() => {}} options={['Vendedor','Gestor de Estoque','Gestor Financeiro']} />
        </Field>
        <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Vendedor:</strong> registra venda, troca e devolução, consulta estoque da rede. Não acessa relatórios, cadastros nem configurações.
        </div>
      </Modal>
    </StoreShell>
  );
}
