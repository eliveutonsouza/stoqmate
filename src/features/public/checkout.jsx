"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { PlanOption } from '@/features/billing/plan-option';
import { CycleToggle } from '@/features/billing/cycle-toggle';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { createCheckoutSessionAction } from '@/features/billing/actions';

// === /checkout?plan=&cycle= ===
// Ponte pro Stripe Checkout: nenhum dado de cartão ou fiscal passa por aqui.
// Sem sessão → cadastro/login; com sessão e perfil de cobrança → resumo do
// plano (validado contra `plans`) e redirect pro Stripe.
export function Checkout({ state }) {
  const navigate = useNavigate();
  const { plans } = state;
  const [planId, setPlanId] = React.useState(state.selectedPlanId);
  const [cycle, setCycle] = React.useState(state.cycle);
  const { pending, error, run } = useRedirectAction();
  const plan = plans.find((p) => p.id === planId) ?? null;
  const price = plan ? (cycle === 'yearly' ? plan.yearly : plan.monthly) : null;
  const saving = plan && plan.yearly != null && cycle === 'yearly' ? plan.monthly * 12 - plan.yearly : 0;

  let gate = null;
  if (!state.signedIn) {
    gate = (
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>Entre ou crie sua conta para assinar</div>
        <p style={{ margin: '6px 0 14px', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          A assinatura fica ligada à sua empresa no Stoqmate. Depois de entrar, volte a esta página para concluir.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/signup')} className="btn btn-primary btn-sm">Criar conta</button>
          <button type="button" onClick={() => navigate('/login')} className="btn btn-outline btn-sm">Já tenho conta</button>
        </div>
      </div>
    );
  } else if (!state.hasTenant) {
    gate = (
      <BillingNotice tone="warning">
        Sua conta ainda não tem empresa vinculada.{' '}
        <a href="/complete-signup" onClick={(e) => { e.preventDefault(); navigate('/complete-signup'); }}>Completar cadastro</a>.
      </BillingNotice>
    );
  } else if (state.hasLiveSubscription) {
    gate = (
      <BillingNotice tone="neutral">
        Sua rede já tem uma assinatura. Para mudar de plano ou de ciclo, use{' '}
        <a href="/settings/subscription/change" onClick={(e) => { e.preventDefault(); navigate('/settings/subscription/change'); }}>Trocar de plano</a>.
      </BillingNotice>
    );
  } else if (!state.canManage) {
    gate = <BillingNotice tone="warning">Só o proprietário ou o financeiro da rede podem assinar. Peça a um deles.</BillingNotice>;
  }

  const disabled = Boolean(gate) || !plan || price == null || Boolean(pending);

  return (
    <LayoutPublic navigate={navigate} route="/checkout">
      <section style={{ maxWidth: 1020, margin: '0 auto', padding: '40px var(--page-pad) 72px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Assinar o Stoqmate
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 560, lineHeight: 1.55 }}>
            Escolha o plano e o ciclo. O pagamento é feito na página segura do Stripe.
          </p>
        </div>

        {state.invalidPlan && <div style={{ marginBottom: 16 }}><BillingNotice tone="warning">O plano do link não está disponível. Escolha um dos planos abaixo.</BillingNotice></div>}

        <div className="form-split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CycleToggle value={cycle} onChange={setCycle} />
            {plans.length === 0 ? (
              <div className="card" style={{ padding: 18, fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum plano disponível no momento.</div>
            ) : (
              <div className="g3" style={{ gap: 10 }}>
                {plans.map((p) => (
                  <PlanOption key={p.id} plan={p} cycle={cycle} selected={p.id === planId} disabled={cycle === 'yearly' && p.yearly == null} onSelect={() => setPlanId(p.id)} />
                ))}
              </div>
            )}
          </div>

          <div data-sticky style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Resumo</div>
              {plan ? (
                <>
                  <SummaryRow label={`Plano ${plan.name}`} value={price != null ? brl(price) : '—'} />
                  <SummaryRow label="Créditos de IA por mês" value={plan.credits.toLocaleString('pt-BR')} />
                  <SummaryRow label="Cobrança" value={cycle === 'yearly' ? 'uma vez por ano' : 'todo mês'} />
                  {saving > 0 && <SummaryRow label="Economia no anual" value={brl(saving)} tone="success" />}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Escolha um plano.</div>
              )}
              {gate && <div style={{ marginTop: 14 }}>{gate}</div>}
              {error && <div style={{ marginTop: 14 }}><BillingNotice tone="danger">{error}</BillingNotice></div>}
              {!gate && (
                <button type="button" disabled={disabled} onClick={() => run('checkout', () => createCheckoutSessionAction({ planId, cycle }))} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16, opacity: disabled ? 0.5 : 1 }}>
                  {pending === 'checkout' ? 'Abrindo o Stripe…' : <>Ir para o pagamento <I.ArrowRight size={14} /></>}
                </button>
              )}
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Pagamento processado pela Stripe. Não armazenamos dados de cartão em nossos servidores.
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
}
