"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { brl } from '@/lib/format';
import { Page } from '@/components/ui/page-container';
import { PlanOption } from '@/features/billing/plan-option';
import { CycleToggle } from '@/features/billing/cycle-toggle';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { changePlanAction } from '@/features/billing/actions';
import { fmtDateLong, CYCLE_LABEL, SUBSCRIPTION_STATUS_LABEL } from '@/features/billing/billing-format';
import { I } from '@/components/icons';
import { SummaryRow } from '@/components/ui/summary-row';

const priceFor = (plan, cycle) => (cycle === 'yearly' ? plan?.yearly : plan?.monthly);

// === /settings/subscription/change — troca de plano ===
// Planos e assinatura vêm do banco (espelho do Stripe). Com assinatura viva a
// troca acontece no Customer Portal, que calcula e mostra o pro rata real
// antes de confirmar; sem assinatura, vira um Checkout novo.
export function PlanChange({ overview }) {
  const navigate = useNavigate();
  const { plans, currentPlanId, subscription, canManage } = overview;
  const cur = plans.find((p) => p.id === currentPlanId) ?? null;
  const [cycle, setCycle] = React.useState(subscription?.cycle ?? 'monthly');
  const [target, setTarget] = React.useState(() => (plans.find((p) => p.id !== currentPlanId) ?? plans[0])?.id ?? null);
  const { pending, error, run } = useRedirectAction();

  const next = plans.find((p) => p.id === target) ?? null;
  const same = Boolean(subscription && next && next.id === subscription.planId && cycle === subscription.cycle);
  const nextPrice = priceFor(next, cycle);
  const blockedByPayment = subscription && (subscription.status === 'past_due' || subscription.status === 'unpaid');
  const disabled = !next || nextPrice == null || same || !canManage || Boolean(pending) || blockedByPayment;

  const headerSub = subscription
    ? `Hoje: ${cur?.name ?? subscription.planId} · ${CYCLE_LABEL[subscription.cycle]}${priceFor(cur, subscription.cycle) != null ? ` · ${brl(priceFor(cur, subscription.cycle))}` : ''} · ${SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status}`
    : `Sem assinatura paga ainda${cur ? ` — cadastro no plano ${cur.name}` : ''}`;

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Trocar de plano']} navigate={navigate}>
      <PageHeader title={subscription ? 'Trocar de plano' : 'Escolher um plano'} sub={headerSub} />
      <Page width={980}>
        {!canManage && <BillingNotice tone="warning">Seu perfil pode ver a assinatura, mas só o proprietário ou o financeiro trocam de plano.</BillingNotice>}
        {blockedByPayment && (
          <BillingNotice tone="warning">
            Há um pagamento pendente nesta assinatura. Regularize antes de trocar de plano —{' '}
            <a href="/billing/past-due" onClick={(e) => { e.preventDefault(); navigate('/billing/past-due'); }}>ver pagamento pendente</a>.
          </BillingNotice>
        )}
        {error && <BillingNotice tone="danger">{error}</BillingNotice>}

        <div className="split-aside" style={{ '--aside': '320px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <CycleToggle value={cycle} onChange={setCycle} />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Preços da tabela atual, por assinatura.</span>
            </div>
            {plans.length === 0 ? (
              <div className="card" style={{ padding: 18, fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum plano disponível no momento.</div>
            ) : plans.map((p) => (
              <PlanOption
                key={p.id} plan={p} cycle={cycle}
                current={p.id === currentPlanId}
                selected={p.id === target}
                disabled={cycle === 'yearly' && p.yearly == null}
                onSelect={() => setTarget(p.id)}
              />
            ))}
            <div className="card" style={{ padding: 16, display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--accent-text)', display: 'flex', marginTop: 1 }}><I.Sparkle size={15} /></span>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                Só precisa de mais IA? Pacotes avulsos de créditos somam ao saldo sem trocar de plano.{' '}
                <a href="/settings/credits" onClick={(e) => { e.preventDefault(); navigate('/settings/credits'); }}>Ver pacotes</a>.
              </div>
            </div>
          </div>

          <div className="card" data-sticky style={{ padding: 18, position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Resumo</div>
            {subscription && cur && (
              <SummaryRow label="Plano atual" value={`${cur.name} · ${priceFor(cur, subscription.cycle) != null ? brl(priceFor(cur, subscription.cycle)) : '—'}/${subscription.cycle === 'yearly' ? 'ano' : 'mês'}`} />
            )}
            {next && (
              <SummaryRow label={subscription ? 'Novo plano' : 'Plano escolhido'} value={`${next.name} · ${nextPrice != null ? brl(nextPrice) : '—'}/${cycle === 'yearly' ? 'ano' : 'mês'}`} />
            )}
            {next && (
              <SummaryRow label="Créditos de IA/mês" value={cur && subscription ? `${cur.credits.toLocaleString('pt-BR')} → ${next.credits.toLocaleString('pt-BR')}` : next.credits.toLocaleString('pt-BR')} />
            )}
            {subscription?.currentPeriodEnd && <SummaryRow label="Ciclo atual até" value={fmtDateLong(subscription.currentPeriodEnd)} />}
            <div style={{ borderTop: '1px solid var(--line)', margin: '10px 0' }}></div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
              {same
                ? 'Este já é o seu plano e ciclo atuais.'
                : subscription
                  ? 'Você confirma a troca no portal de cobrança do Stripe, que mostra o valor exato (com o proporcional do ciclo) antes de cobrar qualquer coisa.'
                  : 'Você segue para o checkout do Stripe, onde informa o pagamento. Nada é cobrado antes de confirmar lá.'}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => run('change', () => changePlanAction({ planId: target, cycle }))}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
            >
              {pending === 'change' ? 'Abrindo…' : subscription ? 'Revisar troca no Stripe' : 'Ir para o pagamento'}
            </button>
            <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-ghost" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>Voltar</button>
            {next && next.yearly != null && cycle === 'monthly' && next.monthly * 12 > next.yearly && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                No ciclo anual o {next.name} sai por {brl(next.yearly)} — {brl(next.monthly * 12 - next.yearly)} a menos que 12 mensalidades.
              </div>
            )}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
