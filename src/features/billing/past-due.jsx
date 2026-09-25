"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { BillingBanner } from '@/features/billing/billing-banner';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { updatePaymentMethodAction } from '@/features/billing/actions';
import { fmtDateLong } from '@/features/billing/billing-format';
import { brl } from '@/lib/format';
import { I } from '@/components/icons';
import { SummaryRow } from '@/components/ui/summary-row';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);

// === /billing/past-due — cobrança que falhou ===
// Estado de acesso vem de fn_session_context (o mesmo que o proxy usa pra
// bloquear): past_due = acesso normal com aviso; unpaid = só cobrança.
// Valor em aberto, tentativas e cartão vêm do Stripe ao vivo.
export function PastDue({ state }) {
  const navigate = useNavigate();
  const { access, subscription, planName, invoice, card, hasCustomer, stripeError, canManage } = state;
  const { pending, error, run } = useRedirectAction();

  const hasProblem = access === 'past_due' || access === 'unpaid' || subscription?.status === 'past_due' || subscription?.status === 'unpaid' || Boolean(invoice);

  if (!hasProblem) {
    return (
      <StoreShell route="/billing/past-due" breadcrumb={['Cobrança', 'Pagamento pendente']} navigate={navigate}>
        <Page width={920}>
          <div className="card">
            <EmptyState
              icon={<I.Check size={18} />}
              title="Nenhum pagamento pendente"
              desc="A cobrança desta rede está em dia."
              action={<button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Ver assinatura</button>}
            />
          </div>
        </Page>
      </StoreShell>
    );
  }

  const blocked = access === 'unpaid' || subscription?.status === 'unpaid';
  const nextAttempt = invoice?.nextAttempt ? fmtDateLong(invoice.nextAttempt) : null;
  const canUpdate = canManage && hasCustomer && !pending;

  const banner = blocked
    ? { tone: 'danger', t: 'A conta está bloqueada por falta de pagamento', d: 'As tentativas de cobrança se esgotaram. Só as telas de cobrança abrem até o pagamento ser confirmado — os dados continuam guardados.' }
    : { tone: 'warning', t: 'Não conseguimos cobrar a assinatura', d: `${nextAttempt ? `O Stripe tenta de novo em ${nextAttempt}. ` : ''}Enquanto isso o sistema funciona normalmente.` };

  return (
    <StoreShell route="/billing/past-due" breadcrumb={['Cobrança', 'Pagamento pendente']} navigate={navigate}>
      <Page width={920}>
        <BillingBanner
          tone={banner.tone} title={banner.t} desc={banner.d}
          action={canManage ? (pending === 'pm' ? 'Abrindo…' : 'Atualizar pagamento') : null}
          actionDisabled={!canUpdate}
          onAction={() => run('pm', updatePaymentMethodAction)}
          secondary={invoice ? 'Ver fatura' : null}
          onSecondary={() => navigate(`/settings/subscription/invoice?id=${invoice.id}`)}
        />
        {!canManage && <BillingNotice tone="warning">Só o proprietário ou o financeiro podem atualizar a forma de pagamento. Avise um deles.</BillingNotice>}
        {canManage && !hasCustomer && <BillingNotice tone="warning">Não há cadastro de cobrança desta rede no Stripe. Assine um plano em Plano e assinatura.</BillingNotice>}
        {stripeError && <BillingNotice tone="warning">{stripeError}</BillingNotice>}
        {error && <BillingNotice tone="danger">{error}</BillingNotice>}

        <div className="split-aside" style={{ '--aside': '300px', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em' }}>Resolver agora</h3>
            <div style={{ margin: '12px 0 16px' }}>
              {planName && <SummaryRow label="Assinatura" value={planName} />}
              {invoice ? (
                <>
                  <SummaryRow label="Valor em aberto" value={invoice.amountDue > 0 ? brl(invoice.amountDue) : '—'} strong />
                  <SummaryRow label="Fatura emitida em" value={fmtDateLong(invoice.createdAt)} />
                  {invoice.attempts > 0 && <SummaryRow label="Tentativas de cobrança" value={String(invoice.attempts)} />}
                  {nextAttempt && <SummaryRow label="Próxima tentativa" value={nextAttempt} />}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>A fatura em aberto ainda não chegou ao nosso registro.</div>
              )}
              <SummaryRow
                label="Cartão cadastrado"
                value={card ? `${cap(card.brand)} •••• ${card.last4}${card.expMonth ? ` · ${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}` : ''}` : stripeError ? '—' : 'Nenhum cartão padrão'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button type="button" disabled={!canUpdate} onClick={() => run('pm', updatePaymentMethodAction)} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', opacity: canUpdate ? 1 : 0.5 }}>
                {pending === 'pm' ? 'Abrindo…' : 'Trocar cartão no portal de cobrança'}
              </button>
              {invoice?.hostedUrl && (
                <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
                  Pagar a fatura no Stripe
                </a>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Assim que o Stripe confirmar o pagamento, o acesso volta sozinho — não precisa avisar a gente.
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>O que funciona agora</div>
            {[
              ['Balcão, estoque e relatórios', !blocked],
              ['Telas de cobrança', true],
              ['Seu perfil', true],
            ].map(([l, on], i, arr) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ color: on ? 'var(--success)' : 'var(--danger)', display: 'flex' }}>{on ? <I.Check size={13} stroke={2.4} /> : <I.X size={13} />}</span>
                <span style={{ fontSize: 12.5, color: on ? 'var(--fg)' : 'var(--fg-muted)', flex: 1 }}>{l}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Nada é apagado por falta de pagamento.
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
