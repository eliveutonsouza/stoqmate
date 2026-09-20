"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';

export function AdminUsers() {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const admins = [
    { name: 'Carlos Mendes', email: 'carlos@stoqmate.com.br', role: 'Super Admin', initials: 'CM', twofa: true, last: 'agora' },
    { name: 'Beatriz Nunes', email: 'beatriz@stoqmate.com.br', role: 'Suporte', initials: 'BN', twofa: true, last: 'há 22 min' },
    { name: 'Rafael Tanaka', email: 'rafael@stoqmate.com.br', role: 'Engenharia', initials: 'RT', twofa: true, last: 'há 2 h' },
    { name: 'Juliana Prado', email: 'juliana@stoqmate.com.br', role: 'Comercial', initials: 'JP', twofa: false, last: 'ontem' },
    { name: 'Felipe Duarte', email: 'felipe@stoqmate.com.br', role: 'Suporte', initials: 'FD', twofa: true, last: 'há 3 dias' },
  ];
  const audit = [
    { time: '14:42', who: 'Beatriz Nunes', action: 'Impersonate em TechPoint', ref: 'SUP-2841', tone: 'warning' },
    { time: '14:18', who: 'Carlos Mendes', action: 'Alterou plano de Casa & Cia Decor · Balcão → Controle', ref: '—' },
    { time: '13:52', who: 'Rafael Tanaka', action: 'Rodou migração de dados em Ferragens União', ref: 'ENG-412' },
    { time: '11:30', who: 'Carlos Mendes', action: 'Suspendeu Distribuidora Plaza por inadimplência', ref: 'FIN-88', tone: 'danger' },
    { time: '10:04', who: 'Juliana Prado', action: 'Criou rede Autopeças Norte em trial', ref: 'COM-1204' },
    { time: '09:12', who: 'Beatriz Nunes', action: 'Reenviou convite para Boutique Alecrim', ref: 'SUP-2836' },
  ];
  return (
    <AdminShell route="/admin/users" breadcrumb={['Usuários']} navigate={navigate}>
      <PageHeader
        title="Usuários da plataforma"
        sub="5 administradores · toda ação é registrada no log de auditoria"
        actions={<button onClick={() => setInviteOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Convidar administrador</button>}
      />
      <Page>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Administradores</h3>
          </div>
          <table className="table">
            <thead><tr><th>Administrador</th><th>Função</th><th>2FA</th><th>Último acesso</th><th style={{ width: 30 }}></th></tr></thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: a.role === 'Super Admin' ? 'var(--fg)' : 'var(--bg-sunken)',
                        color: a.role === 'Super Admin' ? 'var(--bg)' : 'var(--fg-muted)',
                        border: a.role === 'Super Admin' ? 'none' : '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}>{a.initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {a.role === 'Super Admin'
                      ? <span className="badge badge-accent"><I.Shield size={10} /> {a.role}</span>
                      : <span className="badge">{a.role}</span>}
                  </td>
                  <td>
                    {a.twofa
                      ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Ativo</span>
                      : <span className="badge badge-warning"><I.Alert size={10} /> Pendente</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{a.last}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Log de auditoria</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ações administrativas de hoje.</p>
            </div>
            <button className="btn btn-outline btn-sm"><I.Download size={12} /> Exportar log</button>
          </div>
          <table className="table">
            <thead><tr><th style={{ width: 60 }}>Hora</th><th style={{ width: 150 }}>Quem</th><th>Ação</th><th>Referência</th></tr></thead>
            <tbody>
              {audit.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{a.time}</td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{a.who}</td>
                  <td style={{ fontSize: 13, color: a.tone === 'danger' ? 'var(--danger)' : a.tone === 'warning' ? 'var(--warning)' : 'var(--fg)' }}>{a.action}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{a.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar administrador" desc="Acesso ao console exige 2FA obrigatório." width={460}
        footer={<><button onClick={() => setInviteOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setInviteOpen(false)} className="btn btn-primary">Enviar convite</button></>}>
        <Field label="Nome completo" required><TextInput placeholder="Nome do administrador" /></Field>
        <Field label="Email corporativo" required hint="Apenas domínios @stoqmate.com.br."><TextInput type="email" placeholder="nome@stoqmate.com.br" /></Field>
        <Field label="Função" required>
          <SelectInput value="Suporte" onChange={() => {}} options={['Super Admin','Suporte','Engenharia','Comercial','Financeiro']} />
        </Field>
        <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Suporte:</strong> lê dados de lojas, faz impersonate com justificativa, reenvia convites. Não altera planos nem exclui lojas.
        </div>
      </Modal>
    </AdminShell>
  );
}

// === Admin reports ===
