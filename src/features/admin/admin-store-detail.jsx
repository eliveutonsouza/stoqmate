"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { EmptyState } from '@/components/ui/empty-state';
import { endImpersonationAction, startImpersonationAction } from '@/features/admin/actions';

const PLAN_NAMES = { balcao: 'Balcão', controle: 'Controle', rede: 'Rede' };
const REASONS = ['Atendimento de ticket de suporte', 'Investigação de bug reportado', 'Demonstração comercial', 'Migração de dados assistida'];

const SUB_STATUS = { active: 'Ativa', trialing: 'Em trial', past_due: 'Pagamento em atraso', canceled: 'Cancelada', incomplete: 'Incompleta', unpaid: 'Não paga' };

export function AdminStoreDetail({ detail, subscription }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [ticket, setTicket] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  if (!detail) {
    return (
      <AdminShell breadcrumb={['Lojas', 'Detalhe']} navigate={navigate}>
        <PageHeader title="Rede" />
        <Page>
          <EmptyState icon={<I.Alert size={18} />} title="Rede não encontrada" desc="O link é inválido ou a rede não existe mais."
            action={<button onClick={() => navigate('/admin/stores')} className="btn btn-primary btn-sm">Voltar</button>} />
        </Page>
      </AdminShell>
    );
  }

  const { tenant: t, stores, users, auditLog, skuCount, openSession } = detail;
  const subs = subscription?.tenant?.subscriptions ?? [];
  const sub = subs.find((s) => s.status !== 'canceled') ?? subs[0] ?? null;

  const startAccess = () => {
    setError('');
    startTransition(async () => {
      const result = await startImpersonationAction({ tenantId: t.id, reason, ticketRef: ticket });
      if (result?.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  };

  const endAccess = () => {
    setError('');
    startTransition(async () => {
      const result = await endImpersonationAction(openSession.id);
      if (result?.error) { setError(result.error); return; }
      router.refresh();
    });
  };

  return (
    <AdminShell breadcrumb={['Lojas', t.name]} navigate={navigate}>
      <PageHeader
        title={t.name}
        sub={`${PLAN_NAMES[t.plan_id] ?? t.plan_id} · ${stores.length} ${stores.length === 1 ? 'loja' : 'lojas'} · cliente desde ${new Date(t.created_at).toLocaleDateString('pt-BR')}`}
        actions={openSession ? (
          <button onClick={endAccess} disabled={pending} className="btn btn-outline btn-sm">
            <I.Logout size={13} /> {pending ? 'Encerrando…' : 'Encerrar acesso de suporte'}
          </button>
        ) : (
          <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
            <I.Logout size={13} style={{ transform: 'scaleX(-1)' }} /> Registrar acesso de suporte
          </button>
        )}
      />
      <Page>
        {openSession && (
          <div role="status" style={{ padding: '10px 13px', marginBottom: 12, background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 7, fontSize: 12.5 }}>
            Acesso de suporte aberto desde {new Date(openSession.started_at).toLocaleString('pt-BR')} — {openSession.reason}
            {openSession.ticket_ref ? ` · ref ${openSession.ticket_ref}` : ''}. Encerre quando terminar.
          </div>
        )}
        {error && !open && (
          <div role="alert" style={{ padding: '10px 13px', marginBottom: 12, background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>{error}</div>
        )}
        <div className="g3 kpi-strip">
          {[
            { l: 'Plano', v: PLAN_NAMES[t.plan_id] ?? t.plan_id },
            { l: 'Lojas', v: `${stores.length}` },
            { l: 'SKUs no catálogo', v: `${skuCount}` },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div className="g2">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Dados cadastrais</h3>
            </div>
            {[
              ['CNPJ', t.cnpj || '—', true],
              ['Cadastrada em', new Date(t.created_at).toLocaleDateString('pt-BR')],
              ...stores.map((s) => [s.type === 'loja' ? 'Loja' : s.type, s.name]),
            ].map(([k, v, mono], i, arr) => (
              <div key={k + i} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Assinatura</h3>
            </div>
            {sub ? (
              [
                ['Status', SUB_STATUS[sub.status] ?? sub.status],
                ['Ciclo', sub.cycle === 'yearly' ? 'Anual' : 'Mensal'],
                ['Fim do período', sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : '—'],
                ['Renovação', sub.cancel_at_period_end ? 'Cancela no fim do período' : 'Automática'],
              ].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--line-soft)' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 110, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: i === 0 && sub.status === 'past_due' ? 'var(--danger)' : undefined }}>{v}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                Sem assinatura no Stripe.{' '}
                {t.trial_ends_at && <>Trial {new Date(t.trial_ends_at) < new Date() ? 'encerrado em' : 'até'} <strong style={{ color: 'var(--fg)' }}>{new Date(t.trial_ends_at).toLocaleDateString('pt-BR')}</strong>.</>}
              </div>
            )}
            <div style={{ padding: '10px 18px' }}>
              <button onClick={() => navigate(`/admin/subscriptions/detail?id=${t.id}`)} className="btn btn-outline btn-sm">Ver cobrança e faturas</button>
            </div>
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Usuários da rede</h3>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum usuário cadastrado.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{u.email}</td>
                    <td style={{ fontSize: 12 }}>{u.role}</td>
                    <td>{u.status === 'active' ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span> : <span className="badge">{u.status}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Auditoria</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Inclui ações da rede e acessos de suporte.</p>
          </div>
          {auditLog.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum registro ainda.</div>
          ) : (
            <table className="table">
              <thead><tr><th style={{ width: 140 }}>Quando</th><th>Quem</th><th>Ação</th></tr></thead>
              <tbody>
                {auditLog.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{new Date(a.created_at).toLocaleString('pt-BR')}</td>
                    <td style={{ fontSize: 12 }}>{a.who}</td>
                    <td style={{ fontSize: 13, color: a.scope === 'platform' ? 'var(--warning)' : 'var(--fg)' }}>{a.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Page>

      <Modal open={open} onClose={() => setOpen(false)} title={`Registrar acesso de suporte a ${t.name}?`} desc="Fica gravado no log de auditoria da rede, visível para ela." width={460}
        footer={<>
          <button onClick={() => setOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={startAccess} disabled={pending} className="btn btn-primary">{pending ? 'Registrando…' : 'Confirmar acesso'}</button>
        </>}>
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}
        <div style={{ padding: '12px 14px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', gap: 11 }}>
          <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={15} /></span>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            Este console não assume a sessão do usuário da rede — só amplia sua leitura de apoio, com motivo obrigatório e registro auditável.
          </div>
        </div>
        <Field label="Motivo do acesso" required hint="Aparece no log da rede.">
          <SelectInput value={reason} onChange={setReason} options={REASONS} />
        </Field>
        <Field label="Referência do ticket"><TextInput mono value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="SUP-2841" /></Field>
      </Modal>
    </AdminShell>
  );
}
