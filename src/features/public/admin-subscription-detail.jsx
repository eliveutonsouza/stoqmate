"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { StatusBadge } from '@/components/domain/status-badge';
import { I } from '@/components/icons';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export function AdminSubscriptionDetail({ detail }) {
  const navigate = useNavigate();
  if (!detail) {
    return (
      <AdminShell route="/admin/subscriptions/detail" breadcrumb={['Assinaturas']} navigate={navigate}>
        <PageHeader title="Assinatura não encontrada" />
        <Page><div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)' }}>Rede não encontrada.</div></Page>
      </AdminShell>
    );
  }

  const { tenant, invoices, events } = detail;
  const plan = tenant.plan;
  const sub = (tenant.subscriptions ?? [])[0] ?? null;
  const billingCustomer = (tenant.billing_customers ?? [])[0] ?? null;
  const mrr = sub ? (sub.cycle === 'yearly' ? (plan?.yearly_price ?? 0) / 12 : (plan?.monthly_price ?? 0)) : 0;
  const ltv = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount_paid), 0);
  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);

  return (
    <AdminShell route="/admin/subscriptions/detail" breadcrumb={['Assinaturas', tenant.name]} navigate={navigate}>
      <PageHeader
        title={`Assinatura · ${tenant.name}`}
        sub={`Plano ${plan?.name ?? tenant.plan_id}${sub ? ` · ${sub.cycle === 'yearly' ? 'anual' : 'mensal'}` : ''}${sub?.stripe_subscription_id ? ` · Stripe ${sub.stripe_subscription_id}` : ''}`}
        actions={(
          <>
            <button onClick={() => navigate(`/admin/stores/edit?id=${tenant.id}`)} className="btn btn-outline btn-sm">Trocar plano</button>
            <button onClick={() => navigate(`/admin/stores/detail?id=${tenant.id}`)} className="btn btn-primary btn-sm">Abrir rede</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Status', badge: sub?.status ?? tenant.status },
            { l: 'MRR', v: brl(mrr) },
            { l: 'Ciclo', v: sub ? (sub.cycle === 'yearly' ? 'Anual' : 'Mensal') : '—' },
            { l: 'Próxima cobrança', v: sub ? (sub.cancel_at_period_end ? `cancela em ${fmtDate(sub.current_period_end)}` : fmtDate(sub.current_period_end)) : '—' },
            { l: 'LTV acumulado', v: brl(ltv), tone: 'success' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              {m.badge ? <div style={{ marginTop: 7 }}><StatusBadge status={m.badge} /></div> : (
                <div style={{
                  fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                  color: m.tone === 'success' ? 'var(--success)' : 'var(--fg)',
                }}>{m.v}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Dados da assinatura</h3>
              </div>
              {[
                ['Plano', plan?.name ?? tenant.plan_id],
                ['Ciclo', sub ? (sub.cycle === 'yearly' ? 'Anual' : 'Mensal') : '—'],
                ['Stripe subscription', sub?.stripe_subscription_id ?? '—', true],
                ['Stripe customer', billingCustomer?.stripe_customer_id ?? '—', true],
                ['Rede desde', fmtDate(tenant.created_at)],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 128, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Faturas</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{invoices.length} fatura(s) · {brl(totalBilled)} faturados no total.</p>
                </div>
              </div>
              {invoices.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma fatura ainda.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Emissão</th><th className="num">Valor</th><th>Status</th><th style={{ width: 70 }}></th></tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(inv.created_at)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(inv.amount_paid)}</td>
                        <td>
                          {inv.status === 'paid'
                            ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Paga</span>
                            : <span className="badge badge-warning">{inv.status}</span>}
                        </td>
                        <td>{inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Abrir</a>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Eventos da assinatura</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Log de auditoria da plataforma pra esta rede.</p>
              </div>
              {events.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum evento registrado ainda.</div>
              ) : (
                events.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 18px', borderBottom: i < events.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', width: 100, flexShrink: 0 }}>{fmtDateTime(e.created_at)}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', borderRadius: 4,
                      background: 'var(--bg-sunken)', color: 'var(--fg-muted)', border: '1px solid var(--line)', flexShrink: 0,
                    }}>{e.kind}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{e.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Page>
    </AdminShell>
  );
}

// === /verify-email — o passo entre criar a conta e usar o sistema ===
