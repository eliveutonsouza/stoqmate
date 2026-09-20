"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SUB, subPlan } from '@/features/billing/billing-state';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';

export function InvoiceDetail() {
  const navigate = useNavigate();
  const p = subPlan();
  const lines = [
    { d: `Plano ${p.name} · mensal`, q: `${SUB.units} lojas`, u: p.monthly, t: p.monthly * SUB.units },
    { d: 'Pacote adicional de créditos de IA', q: '500 créditos', u: 49, t: 49 },
  ];
  const sub = lines.reduce((s, l) => s + l.t, 0);
  const disc = Math.round(sub * 0.05);
  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Fatura 4821']} navigate={navigate}>
      <PageHeader
        title="Fatura de setembro de 2026"
        sub="Emitida em 01 set 2026 · paga em 01 set 2026 · NFS-e 4821"
        actions={<>
          <button className="btn btn-outline btn-sm"><I.Download size={13} /> Baixar NFS-e</button>
          <button className="btn btn-primary btn-sm"><I.Download size={13} /> Baixar recibo</button>
        </>}
      />
      <Page width={880}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Cobrado de</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                Bonsucesso Comércio de Varejo LTDA<br />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>CNPJ 12.345.678/0001-90</span><br />
                <span style={{ color: 'var(--fg-muted)' }}>Rio de Janeiro · RJ</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success"><span className="badge-dot"></span> Paga</span>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', marginTop: 8 }}>{brl(sub - disc)}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{SUB.card}</div>
            </div>
          </div>
          <table className="table">
            <thead><tr><th>Item</th><th>Quantidade</th><th className="num">Unitário</th><th className="num">Total</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13 }}>{l.d}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{l.q}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(l.u)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(l.t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 280 }}>
              <SummaryRow label="Subtotal" value={brl(sub)} />
              <SummaryRow label="Desconto de indicação (5%)" value={'− ' + brl(disc)} tone="down" />
              <SummaryRow label="Total pago" value={brl(sub - disc)} strong />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--fg-muted)', display: 'flex', marginTop: 1 }}><I.Activity size={15} /></span>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Cobrança autorizada em 01/09 às 03:12 · NFS-e emitida às 03:14 e enviada para financeiro@bonsucesso.com.br ·
            Uso de créditos do período: 842 de 1.000 da cota + 500 do pacote.
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /settings/subscription/change — troca de plano com pro rata explícito ===
