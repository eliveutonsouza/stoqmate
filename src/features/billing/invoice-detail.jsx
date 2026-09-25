"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { BillingNotice } from '@/features/billing/billing-notice';
import { fmtDateLong, fmtDateShort, fmtMonthYear, INVOICE_STATUS } from '@/features/billing/billing-format';

// === /settings/subscription/invoice?id= ===
// Linha de `invoices` (espelho do webhook) da própria rede; itens, desconto
// e dados do cliente vêm da fatura no Stripe. Baixar = links oficiais da
// fatura hospedada e do PDF gerados pelo Stripe.
export function InvoiceDetail({ data }) {
  const navigate = useNavigate();
  const { invoice, stripe, stripeError } = data;

  if (!invoice) {
    return (
      <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Fatura']} navigate={navigate}>
        <PageHeader title="Fatura" />
        <Page width={880}>
          <div className="card">
            <EmptyState
              icon={<I.Credit size={18} />}
              title="Fatura não encontrada"
              desc="Abra uma fatura a partir do histórico em Plano e assinatura."
              action={<button type="button" onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Ver histórico de faturas</button>}
            />
          </div>
        </Page>
      </StoreShell>
    );
  }

  const [statusLabel, statusClass] = INVOICE_STATUS[invoice.status] ?? [invoice.status, 'badge'];
  const title = stripe?.number ? `Fatura ${stripe.number}` : 'Fatura';
  const periodRef = stripe?.periodEnd ?? invoice.periodEnd;
  const paidAt = stripe?.paidAt;
  const total = stripe ? stripe.total : invoice.amountPaid;
  const billedName = stripe?.customerName || invoice.tenantName;
  const taxIds = stripe?.taxIds?.length ? stripe.taxIds : invoice.tenantCnpj ? [invoice.tenantCnpj] : [];

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', title]} navigate={navigate}>
      <PageHeader
        title={periodRef ? `${title} · ${fmtMonthYear(periodRef)}` : title}
        sub={`Emitida em ${fmtDateLong(invoice.createdAt)}${paidAt ? ` · paga em ${fmtDateLong(paidAt)}` : ''}`}
        actions={(invoice.pdfUrl || invoice.hostedUrl) ? <>
          {invoice.hostedUrl && <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><I.ArrowRight size={13} /> Abrir no Stripe</a>}
          {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><I.Download size={13} /> Baixar PDF</a>}
        </> : null}
      />
      <Page width={880}>
        {stripeError && <BillingNotice tone="warning">{stripeError} Os itens da fatura não puderam ser carregados.</BillingNotice>}
        <div className="card table-scroll">
          <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Cobrado de</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                {billedName}
                {taxIds.map((t) => <span key={t}><br /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{t}</span></span>)}
                {stripe?.customerEmail && <><br /><span style={{ color: 'var(--fg-muted)' }}>{stripe.customerEmail}</span></>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${statusClass}`}><span className="badge-dot"></span> {statusLabel}</span>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', marginTop: 8 }}>{brl(total)}</div>
              {stripe && stripe.amountRemaining > 0 && <div style={{ fontSize: 11.5, color: 'var(--warning)', marginTop: 2 }}>{brl(stripe.amountRemaining)} em aberto</div>}
            </div>
          </div>
          {stripe && stripe.lines.length > 0 && (
            <table className="table">
              <thead><tr><th>Item</th><th>Período</th><th>Qtd.</th><th className="num">Total</th></tr></thead>
              <tbody>
                {stripe.lines.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 13 }}>{l.description}</td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.start && l.end ? `${fmtDateShort(l.start)} – ${fmtDateShort(l.end)}` : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{l.quantity}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {stripe?.moreLines && (
            <div style={{ padding: '10px 20px', fontSize: 12, color: 'var(--fg-muted)', borderTop: '1px solid var(--line)' }}>
              A fatura tem mais itens — a lista completa está no PDF.
            </div>
          )}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 280, maxWidth: '100%' }}>
              {stripe ? (
                <>
                  <SummaryRow label="Subtotal" value={brl(stripe.subtotal)} />
                  {stripe.discount > 0 && <SummaryRow label="Descontos" value={'− ' + brl(stripe.discount)} tone="success" />}
                  <SummaryRow label="Total" value={brl(stripe.total)} strong />
                  <SummaryRow label="Pago" value={brl(stripe.amountPaid)} />
                </>
              ) : (
                <SummaryRow label="Valor pago" value={brl(invoice.amountPaid)} strong />
              )}
            </div>
          </div>
        </div>
        {stripe?.dueDate && invoice.status !== 'paid' && (
          <div className="card" style={{ padding: 16, fontSize: 12.5, color: 'var(--fg-muted)' }}>Vencimento: {fmtDateLong(stripe.dueDate)}</div>
        )}
      </Page>
    </StoreShell>
  );
}
