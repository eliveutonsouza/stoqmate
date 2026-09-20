"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK } from '@/lib/mock';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { StatusBadge } from '@/components/domain/status-badge';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';

export function AdminStoreDetail() {
  const navigate = useNavigate();
  const s = MOCK.stores[0];
  const [impersonateOpen, setImpersonateOpen] = React.useState(false);
  return (
    <AdminShell route="/admin/stores/detail" breadcrumb={['Lojas', s.name]} navigate={navigate}>
      <PageHeader
        title={s.name}
        sub={`${s.city} · plano ${s.plan} · ${s.units} lojas · cliente desde ${s.since}`}
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Suspender</button>
            <button onClick={() => navigate('/admin/stores/edit')} className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => setImpersonateOpen(true)} className="btn btn-primary btn-sm">
              <I.Logout size={13} style={{ transform: 'scaleX(-1)' }} /> Entrar como rede
            </button>
          </>
        )}
        tabs={[{ id: 'o', label: 'Visão geral' }, { id: 'u', label: 'Usuários · 8' }, { id: 'b', label: 'Faturamento' }, { id: 'a', label: 'Auditoria' }]}
        activeTab="o"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Status', v: 'Ativa', badge: 'active' },
            { l: 'MRR', v: s.mrr },
            { l: 'Lojas', v: `${s.units} / 5` },
            { l: 'SKUs', v: s.skus.toLocaleString('pt-BR') },
            { l: 'Movimentações 30d', v: '1.142' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              {m.badge ? (
                <div style={{ marginTop: 7 }}><StatusBadge status={m.badge} /></div>
              ) : (
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Dados cadastrais</h3>
            </div>
            {[
              ['Razão social', 'Bonsucesso Comércio Varejista Ltda.'],
              ['CNPJ', '24.531.908/0001-72', true],
              ['Subdomínio', 'bonsucesso.stoqmate.com.br', true],
              ['Endereço', 'Av. Brigadeiro Faria Lima, 2232 — Loja 14'],
              ['Cidade', 'São Paulo · SP'],
              ['Telefone', '(11) 3813-4400', true],
              ['Email', 'contato@bonsucesso.com.br'],
              ['Onboarding', 'Concluído em 14 fev 2026'],
            ].map(([k, v, mono], i, arr) => (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Atividade da rede</h3>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>Movimentações registradas por dia.</p>
              <MiniAreaChart data={MOCK.salesSeries} height={130} />
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Assinatura</h3>
              </div>
              <div style={{ padding: 18 }}>
                <SummaryRow label="Plano" value="Controle · mensal" />
                <SummaryRow label="Valor" value={brl(890)} />
                <SummaryRow label="Ciclo atual" value="01/09 – 30/09" />
                <SummaryRow label="Próxima cobrança" value="01 out 2026" />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="LTV acumulado" value={brl(6230)} strong tone="success" />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                  <button onClick={() => navigate('/admin/plans/edit')} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Trocar plano</button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Ver faturas</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Usuários da rede</h3>
          </div>
          <table className="table">
            <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Último acesso</th></tr></thead>
            <tbody>
              {[
                ['Mariana Souza', 'mariana@bonsucesso.com.br', 'Proprietária', 'agora'],
                ['Ana Ribeiro', 'ana@bonsucesso.com.br', 'Gestora de Estoque', 'há 4 min'],
                ['Roberto Lima', 'roberto@bonsucesso.com.br', 'Gestor Financeiro', 'ontem'],
                ['Lucas Prado', 'lucas@bonsucesso.com.br', 'Vendedor', 'há 12 min'],
                ['Marina Alves', 'marina@bonsucesso.com.br', 'Vendedor', 'há 1 h'],
              ].map(([n, e, r, l], i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{n}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{e}</td>
                  <td style={{ fontSize: 12 }}>{r}</td>
                  <td><span className="badge badge-success"><span className="badge-dot"></span> Ativo</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>

      <Modal open={impersonateOpen} onClose={() => setImpersonateOpen(false)} title="Entrar como Bonsucesso Varejo?" desc="Você verá o painel exatamente como a rede vê." width={460}
        footer={<>
          <button onClick={() => setImpersonateOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Entrar como rede</button>
        </>}>
        <div style={{ padding: '12px 14px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', gap: 11 }}>
          <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={15} /></span>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            Sessão de impersonate é <strong>registrada no log de auditoria</strong> com seu usuário, IP e horário.
            A rede é notificada por email. Ações destrutivas ficam bloqueadas.
          </div>
        </div>
        <Field label="Motivo do acesso" required hint="Aparece no log e no email enviado à rede.">
          <SelectInput value="Atendimento de ticket de suporte" onChange={() => {}}
            options={['Atendimento de ticket de suporte','Investigação de bug reportado','Demonstração comercial','Migração de dados assistida']} />
        </Field>
        <Field label="Referência do ticket"><TextInput mono placeholder="SUP-2841" /></Field>
      </Modal>
    </AdminShell>
  );
}

// === Plans CRUD ===
