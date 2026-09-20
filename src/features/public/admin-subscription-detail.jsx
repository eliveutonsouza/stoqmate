"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { StatusBadge } from '@/components/domain/status-badge';
import { I } from '@/components/icons';

export function AdminSubscriptionDetail() {
  const navigate = useNavigate();
  const invoices = [
    { ref: 'INV-2026-0918', date: '01 set 2026', period: '01/09 – 30/09', value: 447, status: 'paid', method: '•••• 4242' },
    { ref: 'INV-2026-0812', date: '01 ago 2026', period: '01/08 – 31/08', value: 447, status: 'paid', method: '•••• 4242' },
    { ref: 'INV-2026-0704', date: '01 jul 2026', period: '01/07 – 31/07', value: 447, status: 'paid', method: '•••• 4242' },
    { ref: 'INV-2026-0601', date: '01 jun 2026', period: '01/06 – 30/06', value: 447, status: 'paid', method: '•••• 1881' },
    { ref: 'INV-2026-0502', date: '01 mai 2026', period: '01/05 – 31/05', value: 447, status: 'refunded', method: '•••• 1881' },
  ];

  return (
    <AdminShell route="/admin/subscriptions/detail" breadcrumb={['Assinaturas', 'Bonsucesso Varejo']} navigate={navigate}>
      <PageHeader
        title="Assinatura · Bonsucesso Varejo"
        sub="Plano Controle · mensal · ativa desde fev 2025 · Stripe sub_1P8x4Kq2"
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Aplicar crédito</button>
            <button onClick={() => navigate('/admin/plans/edit')} className="btn btn-outline btn-sm">Trocar plano</button>
            <button onClick={() => navigate('/admin/stores/detail')} className="btn btn-primary btn-sm">Abrir rede</button>
          </>
        )}
        tabs={[{ id: 'o', label: 'Visão geral' }, { id: 'i', label: 'Faturas · 20' }, { id: 'e', label: 'Eventos' }]}
        activeTab="o"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Status', v: 'Ativa', badge: 'active' },
            { l: 'MRR', v: brl(447) },
            { l: 'Ciclo atual', v: '01/09 – 30/09' },
            { l: 'Próxima cobrança', v: '01 out 2026' },
            { l: 'LTV acumulado', v: brl(6230), tone: 'success' },
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
                ['Plano', 'Controle'],
                ['Ciclo', 'Mensal'],
                ['Valor por loja', brl(149), true],
                ['Lojas cobradas', '3', true],
                ['Stripe subscription', 'sub_1P8x4Kq2', true],
                ['Stripe customer', 'cus_9Kd2mN4x', true],
                ['Forma de pagamento', 'Visa •••• 4242'],
                ['Validade do cartão', '08/2029', true],
                ['CNPJ da nota', '24.531.908/0001-72', true],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 128, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Ações de cobrança</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {['Reprocessar última cobrança', 'Emitir fatura manual', 'Estender trial em 7 dias', 'Pausar cobrança'].map(a => (
                  <button key={a} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>{a}</button>
                ))}
                <button className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start', width: '100%', marginTop: 4 }}>
                  Cancelar assinatura
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Faturas</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>20 faturas · R$ 8.046 faturados no total.</p>
                </div>
                <button className="btn btn-outline btn-sm"><I.Download size={12} /> Exportar</button>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Fatura</th><th>Emissão</th><th>Competência</th><th className="num">Valor</th><th>Pagamento</th><th>Status</th><th style={{ width: 70 }}></th></tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.ref}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{inv.ref}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{inv.date}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{inv.period}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(inv.value)}</td>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{inv.method}</td>
                      <td>
                        {inv.status === 'paid'
                          ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Paga</span>
                          : <span className="badge badge-warning">Reembolsada</span>}
                      </td>
                      <td><button className="btn btn-ghost btn-sm">PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Eventos da assinatura</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Webhooks da Stripe e ações administrativas.</p>
              </div>
              {[
                ['01 set 10:02', 'invoice.paid', 'R$ 447,00 · Visa •••• 4242', 'ok'],
                ['01 set 10:01', 'invoice.created', 'Competência 01/09 – 30/09', 'ok'],
                ['14 jun 14:20', 'customer.source.updated', 'Cartão trocado pelo cliente', 'ok'],
                ['02 mai 09:14', 'charge.refunded', 'R$ 447,00 · cobrança duplicada', 'warn'],
                ['18 fev 11:00', 'customer.subscription.updated', 'Balcão → Controle', 'ok'],
                ['14 fev 08:30', 'customer.subscription.created', 'Trial de 30 dias', 'ok'],
              ].map(([when, ev, detail, tone], i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', width: 82, flexShrink: 0 }}>{when}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', borderRadius: 4,
                    background: tone === 'warn' ? 'var(--warning-soft)' : 'var(--bg-sunken)',
                    color: tone === 'warn' ? 'var(--warning)' : 'var(--fg-muted)',
                    border: '1px solid ' + (tone === 'warn' ? 'transparent' : 'var(--line)'),
                    flexShrink: 0,
                  }}>{ev}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    </AdminShell>
  );
}

// === /verify-email — o passo entre criar a conta e usar o sistema ===
