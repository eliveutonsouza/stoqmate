"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { brl } from '@/lib/format';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { cancelSubscriptionAction, createPortalSessionAction } from '@/features/billing/actions';
import { fmtDateLong, CYCLE_LABEL } from '@/features/billing/billing-format';

// === /settings/subscription/cancel ===
// Confirmar abre o fluxo de cancelamento do Customer Portal do Stripe para a
// assinatura real; o webhook espelha o resultado em `subscriptions`. Motivo
// de cancelamento não é coletado aqui — não há onde guardá-lo.
export function CancelSubscription({ overview }) {
  const navigate = useNavigate();
  const { plans, currentPlanId, subscription, canManage } = overview;
  const [confirmText, setConfirmText] = React.useState('');
  const { pending, error, run } = useRedirectAction();
  const cur = plans.find((p) => p.id === currentPlanId) ?? null;
  const cheaper = cur ? plans.filter((p) => p.monthly < cur.monthly).sort((a, b) => a.monthly - b.monthly)[0] : null;
  const periodEnd = subscription?.currentPeriodEnd ? fmtDateLong(subscription.currentPeriodEnd) : null;

  const shell = (children) => (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Cancelar']} navigate={navigate}>
      <PageHeader
        title="Cancelar assinatura"
        sub={subscription ? `${cur?.name ?? subscription.planId} · ${CYCLE_LABEL[subscription.cycle]}${periodEnd ? ` · período pago até ${periodEnd}` : ''}` : 'Nenhuma assinatura ativa'}
      />
      <Page width={720}>{children}</Page>
    </StoreShell>
  );

  if (!subscription) {
    return shell(
      <div className="card">
        <EmptyState
          icon={<I.Credit size={18} />}
          title="Não há assinatura ativa para cancelar"
          desc="Esta rede não tem uma assinatura paga em andamento."
          action={<button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Voltar para assinatura</button>}
        />
      </div>,
    );
  }

  if (subscription.cancelAtPeriodEnd) {
    return shell(
      <>
        {error && <BillingNotice tone="danger">{error}</BillingNotice>}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>O cancelamento já está agendado</h3>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
            A assinatura termina {periodEnd ? <>em <strong style={{ color: 'var(--fg)' }}>{periodEnd}</strong></> : 'no fim do período atual'} e não será renovada.
            Mudou de ideia? Dá para desfazer no portal de cobrança até lá.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={!canManage || Boolean(pending)} onClick={() => run('portal', createPortalSessionAction)} className="btn btn-primary" style={{ opacity: !canManage || pending ? 0.6 : 1 }}>
              {pending === 'portal' ? 'Abrindo…' : 'Abrir portal de cobrança'}
            </button>
            <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-ghost">Voltar</button>
          </div>
        </div>
      </>,
    );
  }

  const ready = confirmText === 'CANCELAR' && canManage && !pending;

  return shell(
    <>
      {!canManage && <BillingNotice tone="warning">Seu perfil pode ver a assinatura, mas só o proprietário ou o financeiro cancelam.</BillingNotice>}
      {error && <BillingNotice tone="danger">{error}</BillingNotice>}

      {(cheaper || (subscription.cycle === 'monthly' && cur?.yearly != null)) && (
        <div className="card" style={{ padding: 20 }}>
          <span className="badge badge-accent" style={{ marginBottom: 12 }}><I.Sparkle size={11} /> Antes de ir</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cheaper && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, fontSize: 13, lineHeight: 1.5 }}>
                  Descer para o <strong>{cheaper.name}</strong> custa {brl(cheaper.monthly)}/mês — {brl(cur.monthly - cheaper.monthly)} a menos que o {cur.name}.
                </div>
                <button type="button" onClick={() => navigate('/settings/subscription/change')} className="btn btn-outline btn-sm">Trocar de plano</button>
              </div>
            )}
            {subscription.cycle === 'monthly' && cur?.yearly != null && cur.monthly * 12 > cur.yearly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, fontSize: 13, lineHeight: 1.5 }}>
                  No anual o {cur.name} sai por {brl(cur.yearly)} por ano — {brl(cur.monthly * 12 - cur.yearly)} a menos que 12 mensalidades.
                </div>
                <button type="button" onClick={() => navigate('/settings/subscription/annual')} className="btn btn-outline btn-sm">Ver anual</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Confirmar cancelamento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '12px 0 16px' }}>
          {[
            'O cancelamento é concluído no portal de cobrança do Stripe, que mostra a data em que ele passa a valer antes de você confirmar.',
            periodEnd ? `Cancelando no fim do período, o acesso continua normal até ${periodEnd}, que já está pago.` : 'Cancelando no fim do período, o acesso continua normal até o fim do ciclo já pago.',
            'Depois disso a conta fica bloqueada: só as telas de cobrança abrem, até alguém reativar a assinatura. Os dados não são apagados automaticamente.',
          ].map((t) => (
            <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--fg-muted)', display: 'flex', marginTop: 2 }}><I.ChevronRight size={12} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', border: '1px solid var(--warning)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--warning)', display: 'flex' }}><I.Download size={15} /></span>
          <div style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            Com a conta bloqueada a tela de exportação não abre. Se quiser uma cópia dos dados, exporte antes.
          </div>
          <button type="button" onClick={() => navigate('/exports')} className="btn btn-outline btn-sm">Exportar dados</button>
        </div>
        <Field label="Digite CANCELAR para confirmar" required>
          <TextInput mono value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CANCELAR" />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-ghost">Voltar</button>
          <button type="button" disabled={!ready} onClick={() => run('cancel', cancelSubscriptionAction)} className="btn btn-danger" style={{ opacity: ready ? 1 : 0.5 }}>
            {pending === 'cancel' ? 'Abrindo…' : 'Cancelar no portal de cobrança'}
          </button>
        </div>
      </div>
    </>,
  );
}
