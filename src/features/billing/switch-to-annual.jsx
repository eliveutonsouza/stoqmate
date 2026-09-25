"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { brl } from '@/lib/format';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { I } from '@/components/icons';
import { SummaryRow } from '@/components/ui/summary-row';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { changePlanAction } from '@/features/billing/actions';
import { fmtDateLong } from '@/features/billing/billing-format';

// === /settings/subscription/annual — trocar o ciclo mensal por anual ===
// Preços e economia saem de `plans` (monthly_price/yearly_price), nunca da
// tabela estática. A troca em si é no Customer Portal (com o proporcional
// calculado pelo Stripe) ou num Checkout anual se ainda não há assinatura.
export function SwitchToAnnual({ overview }) {
  const navigate = useNavigate();
  const { plans, currentPlanId, subscription, canManage } = overview;
  const { pending, error, run } = useRedirectAction();
  const p = plans.find((x) => x.id === currentPlanId) ?? null;

  const shell = (sub, children) => (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Mudar para anual']} navigate={navigate}>
      <PageHeader title="Mudar para o plano anual" sub={sub} />
      <Page width={980}>{children}</Page>
    </StoreShell>
  );
  const back = <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Voltar para assinatura</button>;

  if (!p || p.yearly == null) {
    return shell('Ciclo anual indisponível', (
      <div className="card"><EmptyState icon={<I.Credit size={18} />} title="Este plano não tem opção anual" desc="O plano atual não tem preço anual cadastrado. Veja os outros planos em Trocar de plano." action={back} /></div>
    ));
  }

  if (subscription?.cycle === 'yearly') {
    return shell(`${p.name} · anual`, (
      <div className="card"><EmptyState icon={<I.Check size={18} />} title="Você já está no ciclo anual" desc={subscription.currentPeriodEnd ? `O ciclo atual vai até ${fmtDateLong(subscription.currentPeriodEnd)}.` : 'A assinatura já é cobrada uma vez por ano.'} action={back} /></div>
    ));
  }

  const twelve = p.monthly * 12;
  const save = twelve - p.yearly;
  const pct = twelve > 0 ? (save / twelve) * 100 : 0;
  const monthsEquivalent = p.monthly > 0 ? p.yearly / p.monthly : null;
  const blockedByPayment = subscription && (subscription.status === 'past_due' || subscription.status === 'unpaid');
  const disabled = !canManage || Boolean(pending) || blockedByPayment;

  return shell(
    `${p.name} · ${subscription ? `hoje você paga ${brl(p.monthly)} por mês` : 'sem assinatura paga ainda'}`,
    <>
      {!canManage && <BillingNotice tone="warning">Seu perfil pode ver a assinatura, mas só o proprietário ou o financeiro mudam o ciclo.</BillingNotice>}
      {blockedByPayment && <BillingNotice tone="warning">Há um pagamento pendente. Regularize em Pagamento pendente antes de mudar o ciclo.</BillingNotice>}
      {error && <BillingNotice tone="danger">{error}</BillingNotice>}
      <div className="split-aside" style={{ '--aside': '330px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 22, borderColor: save > 0 ? 'var(--accent)' : undefined }}>
            {save > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.035em' }}>{brl(save)}</span>
                  <span style={{ fontSize: 14, color: 'var(--fg-muted)' }}>de economia por ano · {pct.toFixed(0)}% a menos</span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 560 }}>
                  No mensal você paga {brl(twelve)} ao longo de 12 meses. No anual são {brl(p.yearly)} de uma vez
                  {monthsEquivalent != null && <> — o equivalente a {monthsEquivalent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mensalidades</>}.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                Pela tabela atual o anual do {p.name} custa {brl(p.yearly)} — não sai mais barato que 12 mensalidades de {brl(p.monthly)}.
              </p>
            )}
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>O que muda</div>
            {[
              ['Uma cobrança por ano', 'O valor anual é cobrado de uma vez; a renovação acontece 12 meses depois.'],
              ['Mesmo plano', `Os recursos e limites do ${p.name} não mudam — só a forma de cobrança.`],
            ].map(([t, d], i, arr) => (
              <div key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ color: 'var(--success)', display: 'flex', marginTop: 2 }}><I.Check size={14} stroke={2.4} /></span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" data-sticky style={{ padding: 18, position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Resumo</div>
          <SummaryRow label={`${p.name} anual`} value={brl(p.yearly)} />
          {subscription && <SummaryRow label={`${p.name} mensal (hoje)`} value={`${brl(p.monthly)}/mês`} />}
          {subscription?.currentPeriodEnd && <SummaryRow label="Mês atual pago até" value={fmtDateLong(subscription.currentPeriodEnd)} />}
          <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            {subscription
              ? 'O portal de cobrança do Stripe desconta o que já foi pago do mês atual e mostra o valor exato antes de você confirmar.'
              : 'Você segue para o checkout do Stripe, onde informa o pagamento. Nada é cobrado antes de confirmar lá.'}
          </div>
          <button type="button" disabled={disabled} onClick={() => run('annual', () => changePlanAction({ planId: p.id, cycle: 'yearly' }))} className="btn btn-primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}>
            {pending === 'annual' ? 'Abrindo…' : subscription ? 'Revisar troca no Stripe' : 'Assinar anual'}
          </button>
          <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-ghost" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>Continuar no mensal</button>
        </div>
      </div>
    </>,
  );
}
