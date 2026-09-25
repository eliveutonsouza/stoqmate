"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { PlanOption } from '@/features/billing/plan-option';
import { CycleToggle } from '@/features/billing/cycle-toggle';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { createCheckoutSessionAction } from '@/features/billing/actions';
import { fmtDateLong, fmtInt } from '@/features/billing/billing-format';
import { brl } from '@/lib/format';

const Section = ({ children }) => (
  <section style={{ maxWidth: 940, margin: '0 auto', padding: '56px var(--page-pad) 80px' }}>{children}</section>
);

// === /trial-ended — o teste acabou ===
// Rota aberta: pode chegar sem sessão, sem empresa ou com qualquer perfil.
// Números do teste são contagens reais desde o cadastro da rede; só
// proprietário/financeiro (billing:2) conseguem assinar.
export function TrialEnded({ state }) {
  const navigate = useNavigate();
  const { plans } = state;
  const [cycle, setCycle] = React.useState('monthly');
  const [planId, setPlanId] = React.useState(() => (plans.find((p) => p.popular) ?? plans[0])?.id ?? null);
  const { pending, error, run } = useRedirectAction();
  const plan = plans.find((p) => p.id === planId) ?? null;

  if (!state.signedIn || !state.hasTenant) {
    return (
      <LayoutPublic navigate={navigate} route="/trial-ended">
        <Section>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {state.signedIn ? 'Termine o cadastro da sua empresa' : 'Entre para ver o seu período de teste'}
          </h1>
          <p style={{ margin: '12px 0 22px', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 560, lineHeight: 1.6 }}>
            {state.signedIn
              ? 'Sua conta ainda não tem uma empresa vinculada.'
              : 'Com a sua conta aberta, mostramos o que foi feito durante o teste e os planos para continuar.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {state.signedIn ? (
              <button type="button" onClick={() => navigate('/complete-signup')} className="btn btn-primary">Completar cadastro</button>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/login')} className="btn btn-primary">Entrar</button>
                <button type="button" onClick={() => navigate('/signup')} className="btn btn-outline">Criar conta</button>
              </>
            )}
          </div>
        </Section>
      </LayoutPublic>
    );
  }

  const { tenantName, createdAt, trialEndsAt, trialEnded, hasLiveSubscription, usage, canManage } = state;
  const stats = [
    usage.products != null && [fmtInt(usage.products), usage.products === 1 ? 'produto ativo' : 'produtos ativos'],
    usage.sales != null && [fmtInt(usage.sales), usage.sales === 1 ? 'venda registrada' : 'vendas registradas'],
    usage.revenue != null && [brl(usage.revenue), 'em vendas no sistema'],
    [fmtInt(usage.stores), usage.stores === 1 ? 'loja cadastrada' : 'lojas cadastradas'],
  ].filter(Boolean);
  const price = plan ? (cycle === 'yearly' ? plan.yearly : plan.monthly) : null;
  const disabled = !plan || price == null || Boolean(pending);

  return (
    <LayoutPublic navigate={navigate} route="/trial-ended">
      <Section>
        <span className={`badge ${trialEnded ? 'badge-warning' : 'badge-info'}`} style={{ marginBottom: 14 }}>
          {trialEnded ? 'Período de teste encerrado' : 'Período de teste em andamento'}
        </span>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.12 }}>
          {hasLiveSubscription
            ? `${tenantName} já tem uma assinatura.`
            : trialEnded
              ? <>O teste de {tenantName} terminou{trialEndsAt ? ` em ${fmtDateLong(trialEndsAt)}` : ''}.<br />Nada do que você cadastrou foi perdido.</>
              : <>O teste de {tenantName} vai até {fmtDateLong(trialEndsAt)}.</>}
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 560, lineHeight: 1.6 }}>
          {hasLiveSubscription
            ? 'Não é preciso assinar de novo.'
            : `Desde o cadastro, em ${fmtDateLong(createdAt)}, isto é o que a rede já tem no sistema. Escolha um plano para continuar usando.`}
        </p>

        {hasLiveSubscription ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-primary">Ir para o painel</button>
            {canManage && <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline">Ver assinatura</button>}
          </div>
        ) : (
          <>
            {stats.length > 0 && (
              <div className="card g4" style={{ padding: 18, margin: '26px 0', gap: 16 }}>
                {stats.map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.025em' }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {canManage ? (
              <>
                <div style={{ marginBottom: 12 }}><CycleToggle value={cycle} onChange={setCycle} /></div>
                <div className="g3" style={{ gap: 12 }}>
                  {plans.map((p) => (
                    <PlanOption key={p.id} plan={p} cycle={cycle} selected={planId === p.id} disabled={cycle === 'yearly' && p.yearly == null} onSelect={() => setPlanId(p.id)} />
                  ))}
                </div>
                {error && <div style={{ marginTop: 16 }}><BillingNotice tone="danger">{error}</BillingNotice></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
                  <button type="button" disabled={disabled} onClick={() => run('checkout', () => createCheckoutSessionAction({ planId, cycle }))} className="btn btn-primary" style={{ opacity: disabled ? 0.5 : 1 }}>
                    {pending === 'checkout' ? 'Abrindo…' : plan && price != null ? `Assinar ${plan.name} · ${brl(price)}/${cycle === 'yearly' ? 'ano' : 'mês'}` : 'Assinar'}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>O pagamento é feito no checkout do Stripe.</span>
                </div>
              </>
            ) : (
              <BillingNotice tone="warning">
                Só o proprietário ou o financeiro da rede podem assinar um plano. Peça a um deles para entrar e escolher o plano.
              </BillingNotice>
            )}
          </>
        )}
      </Section>
    </LayoutPublic>
  );
}
