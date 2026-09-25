"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { BillingBanner } from '@/features/billing/billing-banner';
import { BillingNotice } from '@/features/billing/billing-notice';
import { useRedirectAction } from '@/features/billing/use-redirect-action';
import { createPackCheckoutSessionAction } from '@/features/billing/actions';
import { fmtDateLong, fmtInt } from '@/features/billing/billing-format';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';

// === /ai/credits-empty — créditos de IA esgotados ===
// Saldo, cota e renovação vêm de `tenants` (o mesmo saldo que
// fn_ai_debit_credits consulta); pacotes de `credit_packs`, comprados via
// Stripe Checkout (createPackCheckoutSessionAction).
export function CreditsEmpty({ state }) {
  const navigate = useNavigate();
  const { planName, planQuota, planBalance, extraBalance, renewsAt, ops, packs, canBuy } = state;
  const { pending, error, run } = useRedirectAction();
  const total = planBalance + extraBalance;
  const empty = total <= 0;
  const renews = fmtDateLong(renewsAt);

  return (
    <StoreShell route="/ai" breadcrumb={['Inteligência artificial', 'Créditos de IA']} navigate={navigate}>
      <Page width={880}>
        <BillingBanner
          tone={empty ? 'warning' : 'success'} icon="Sparkle"
          title={empty ? 'Os créditos de IA acabaram' : `Você ainda tem ${fmtInt(total)} ${total === 1 ? 'crédito' : 'créditos'} de IA`}
          desc={empty
            ? `A cota do plano renova em ${renews}. Até lá as operações de IA ficam indisponíveis; balcão, estoque e relatórios seguem normais.`
            : `A cota do plano renova em ${renews}.`}
          secondary="Ver consumo" onSecondary={() => navigate('/settings/credits')}
        />
        {error && <BillingNotice tone="danger">{error}</BillingNotice>}

        <div className="g2">
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>Saldo</div>
            <SummaryRow label={planName ? `Cota do plano ${planName}` : 'Cota do plano'} value={planQuota != null ? `${fmtInt(planBalance)} de ${fmtInt(planQuota)}` : fmtInt(planBalance)} />
            <SummaryRow label="Créditos avulsos" value={fmtInt(extraBalance)} />
            <SummaryRow label="Total disponível" value={fmtInt(total)} strong />
            <SummaryRow label="Cota renova em" value={renews} />
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              A cota do plano zera e volta cheia a cada renovação. Créditos avulsos não vencem na renovação.
            </div>
          </div>
          {ops.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>Quanto custa cada operação</div>
              {ops.map((o) => (
                <SummaryRow key={o.id} label={o.label} value={`${o.credits} ${o.credits === 1 ? 'crédito' : 'créditos'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>Comprar créditos avulsos</div>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Pagamento único no checkout do Stripe; os créditos entram assim que ele confirmar.</p>
          {!canBuy && <div style={{ marginBottom: 12 }}><BillingNotice tone="warning">Só o proprietário ou o financeiro podem comprar créditos.</BillingNotice></div>}
          {packs.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum pacote à venda no momento.</div>
          ) : (
            <div className="g3" style={{ gap: 10 }}>
              {packs.map((p) => {
                const off = !canBuy || Boolean(pending);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={off}
                    onClick={() => run(p.id, () => createPackCheckoutSessionAction(p.id))}
                    style={{ padding: '13px 15px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-elev)', textAlign: 'left', opacity: off && pending !== p.id ? 0.6 : 1 }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>{fmtInt(p.credits)} créditos</div>
                    <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', marginTop: 4, color: 'var(--fg)' }}>{brl(p.price)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--accent-text)', marginTop: 4, fontWeight: 500 }}>{pending === p.id ? 'Abrindo…' : 'Comprar'}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
