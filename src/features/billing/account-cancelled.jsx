"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { BillingBanner } from '@/features/billing/billing-banner';
import { BillingNotice } from '@/features/billing/billing-notice';
import { PlanOption } from '@/features/billing/plan-option';
import { CycleToggle } from '@/features/billing/cycle-toggle';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { createCheckoutSessionAction } from '@/features/billing/actions';
import { fmtDateLong, fmtInt } from '@/features/billing/billing-format';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';

// === /account/cancelled — conta cancelada, com porta de volta ===
// Data de cancelamento e contagens são reais (tenants/subscriptions/Stripe,
// products, stores, fn_sales_report). Não existe regra automática de
// exclusão de dados, então a tela não promete prazo nenhum.
export function AccountCancelled({ state }) {
  const navigate = useNavigate();
  const { tenantName, tenantStatus, canceledAt, hasLiveSubscription, previousPlanId, plans, usage, stripeError, canManage } = state;
  const [cycle, setCycle] = React.useState('monthly');
  const [planId, setPlanId] = React.useState(() => (plans.find((p) => p.id === previousPlanId) ?? plans.find((p) => p.popular) ?? plans[0])?.id ?? null);
  const { pending, error, run } = useRedirectAction();
  const plan = plans.find((p) => p.id === planId) ?? null;

  if (tenantStatus !== 'canceled') {
    return (
      <StoreShell route="/account/cancelled" breadcrumb={['Conta cancelada']} navigate={navigate}>
        <Page width={860}>
          <div className="card">
            <EmptyState
              icon={<I.Check size={18} />}
              title="Esta conta não está cancelada"
              desc="A assinatura desta rede segue ativa."
              action={<button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Ver assinatura</button>}
            />
          </div>
        </Page>
      </StoreShell>
    );
  }

  const stats = [
    usage.products != null && [fmtInt(usage.products), usage.products === 1 ? 'produto ativo' : 'produtos ativos'],
    [fmtInt(usage.stores), usage.stores === 1 ? 'loja cadastrada' : 'lojas cadastradas'],
    usage.sales != null && [fmtInt(usage.sales), usage.sales === 1 ? 'venda registrada' : 'vendas registradas'],
    usage.revenue != null && [brl(usage.revenue), 'em vendas registradas'],
  ].filter(Boolean);
  const price = plan ? (cycle === 'yearly' ? plan.yearly : plan.monthly) : null;
  const disabled = !canManage || !plan || price == null || Boolean(pending) || hasLiveSubscription;

  return (
    <StoreShell route="/account/cancelled" breadcrumb={['Conta cancelada']} navigate={navigate}>
      <Page width={860}>
        <BillingBanner
          tone="danger" icon="Credit"
          title="Assinatura cancelada — o acesso à loja está bloqueado"
          desc={`${canceledAt ? `Cancelada em ${fmtDateLong(canceledAt)}. ` : ''}Só as telas de cobrança e o seu perfil abrem até a assinatura ser reativada.`}
        />
        {stripeError && <BillingNotice tone="warning">{stripeError}</BillingNotice>}

        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>Os dados de {tenantName} continuam aqui</h2>
          <p style={{ margin: '8px 0 18px', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 560 }}>
            Cancelar não apaga nada automaticamente. Reativando, a rede volta com o mesmo catálogo, histórico, usuários e regras.
          </p>
          <div className="g4" style={{ gap: 14 }}>
            {stats.map(([v, l]) => (
              <div key={l} style={{ padding: '13px 15px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Reativar</div>
              <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Escolha o plano; o pagamento é feito no checkout do Stripe e o acesso volta assim que ele confirmar.
              </p>
            </div>
            <CycleToggle value={cycle} onChange={setCycle} />
          </div>
          {!canManage && <div style={{ marginTop: 12 }}><BillingNotice tone="warning">Só o proprietário ou o financeiro podem reativar. Peça a um deles.</BillingNotice></div>}
          {hasLiveSubscription && <div style={{ marginTop: 12 }}><BillingNotice tone="warning">Já existe uma assinatura em andamento para esta rede. Veja em Plano e assinatura.</BillingNotice></div>}
          {error && <div style={{ marginTop: 12 }}><BillingNotice tone="danger">{error}</BillingNotice></div>}
          <div className="g3" style={{ gap: 10, marginTop: 14 }}>
            {plans.map((p) => (
              <PlanOption key={p.id} plan={p} cycle={cycle} current={p.id === previousPlanId} selected={p.id === planId} disabled={cycle === 'yearly' && p.yearly == null} onSelect={() => setPlanId(p.id)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" disabled={disabled} onClick={() => run('reactivate', () => createCheckoutSessionAction({ planId, cycle }))} className="btn btn-primary" style={{ opacity: disabled ? 0.5 : 1 }}>
              {pending === 'reactivate' ? 'Abrindo…' : plan && price != null ? `Reativar no ${plan.name} · ${brl(price)}/${cycle === 'yearly' ? 'ano' : 'mês'}` : 'Reativar'}
            </button>
            <button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-ghost">Ver assinatura e faturas</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
