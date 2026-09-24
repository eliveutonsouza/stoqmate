"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useSearchParams } from 'next/navigation';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { brl } from '@/lib/format';
import { I } from '@/components/icons';
import { createCheckoutSessionAction, createPortalSessionAction } from '@/features/billing/actions';

const STATUS_LABELS = {
  trialing: ['Em teste', 'badge-info'],
  active: ['Ativa', 'badge-success'],
  past_due: ['Pagamento atrasado', 'badge-warning'],
  canceled: ['Cancelada', 'badge'],
  incomplete: ['Pendente', 'badge-warning'],
  incomplete_expired: ['Expirada', 'badge'],
  unpaid: ['Não paga', 'badge-warning'],
};

export function SettingsSubscription({ billing }) {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');
  const { subscription, invoices, plans, currentPlanId } = billing;
  const [pendingId, setPendingId] = React.useState(null);
  const [error, setError] = React.useState('');

  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const status = subscription ? STATUS_LABELS[subscription.status] ?? [subscription.status, 'badge'] : null;
  const price = subscription
    ? (subscription.cycle === 'yearly' ? currentPlan?.yearly_price : currentPlan?.monthly_price)
    : currentPlan?.monthly_price;

  const subscribe = (planId, cycle) => {
    setError('');
    setPendingId(`${planId}-${cycle}`);
    createCheckoutSessionAction({ planId, cycle }).then((result) => {
      setPendingId(null);
      if (result?.error) { setError(result.error); return; }
      if (result?.url) window.location.href = result.url;
    });
  };

  const manage = () => {
    setError('');
    setPendingId('portal');
    createPortalSessionAction().then((result) => {
      setPendingId(null);
      if (result?.error) { setError(result.error); return; }
      if (result?.url) window.location.href = result.url;
    });
  };

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura']} navigate={navigate}>
      <PageHeader title="Plano e assinatura" sub="O que você paga, quando cobra de novo e como sair quando quiser." />
      <SettingsLayout route="/settings/subscription" navigate={navigate}>
        {checkoutResult === 'success' && (
          <div style={{ padding: '10px 12px', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 7, fontSize: 12.5 }}>Assinatura confirmada.</div>
        )}
        {checkoutResult === 'cancelled' && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12.5 }}>Checkout cancelado — nenhuma cobrança foi feita.</div>
        )}
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>{error}</div>}

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Plano {currentPlan?.name ?? currentPlanId}</span>
                {status && <span className={`badge ${status[1]}`}><span className="badge-dot"></span> {status[0]}</span>}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
                {price != null ? brl(price) : '—'} {subscription?.cycle === 'yearly' ? 'por ano' : 'por mês'}
                {subscription?.current_period_end && ` · próxima cobrança em ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`}
                {subscription?.cancel_at_period_end && ' · cancela ao fim do período'}
              </p>
            </div>
            {subscription && (
              <button onClick={manage} disabled={pendingId === 'portal'} className="btn btn-primary btn-sm">
                {pendingId === 'portal' ? 'Abrindo…' : 'Gerenciar assinatura'}
              </button>
            )}
          </div>
          {!subscription && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-muted)' }}>
              Sem assinatura paga ainda — a rede opera no plano {currentPlan?.name ?? currentPlanId} sem cobrança até você assinar abaixo.
            </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>{subscription ? 'Trocar de plano' : 'Assinar um plano'}</h3>
          <div className="g3" style={{ gap: 12 }}>
            {plans.map((p) => (
              <div key={p.id} className="card" style={{ padding: 16, borderColor: p.id === currentPlanId ? 'var(--accent)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                  {p.popular && <span className="badge badge-accent">Mais escolhido</span>}
                  {p.id === currentPlanId && <span className="badge badge-success">Atual</span>}
                </div>
                <p style={{ margin: '5px 0 10px', fontSize: 12, color: 'var(--fg-muted)' }}>{p.tagline}</p>
                <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{brl(p.monthly_price)}<span style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400 }}>/mês</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  <button onClick={() => subscribe(p.id, 'monthly')} disabled={!!pendingId} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                    {pendingId === `${p.id}-monthly` ? 'Abrindo…' : 'Assinar mensal'}
                  </button>
                  {p.yearly_price && (
                    <button onClick={() => subscribe(p.id, 'yearly')} disabled={!!pendingId} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                      {pendingId === `${p.id}-yearly` ? 'Abrindo…' : `Assinar anual · ${brl(p.yearly_price)}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Histórico de faturas</h3>
          </div>
          {invoices.length === 0 ? (
            <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma fatura ainda.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Data</th><th className="num">Valor</th><th>Status</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{new Date(inv.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(inv.amount_paid)}</td>
                    <td>{inv.status === 'paid' ? <span className="badge badge-success">Pago</span> : <span className="badge badge-warning">{inv.status}</span>}</td>
                    <td>{inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><I.Download size={11} /> Abrir</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {subscription && (
          <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Trocar cartão, mudar de plano ou cancelar</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>Tudo isso fica no portal de cobrança, fora do nosso painel.</div>
            </div>
            <button onClick={manage} disabled={pendingId === 'portal'} className="btn btn-outline btn-sm">Abrir portal de cobrança</button>
          </div>
        )}
      </SettingsLayout>
    </StoreShell>
  );
}
