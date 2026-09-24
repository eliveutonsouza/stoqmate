"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { SUB, subPlan, subTotal } from '@/features/billing/billing-state';
import { ANNUAL, annualSavings } from '@/lib/plans';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { brl } from '@/lib/format';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { SummaryRow } from '@/components/ui/summary-row';

export function SwitchToAnnual() {
  const navigate = useNavigate();
  const [method, setMethod] = React.useState('card');
  const p = subPlan();
  const s = annualSavings(p, SUB.units);
  const daysLeft = 12, cycleDays = 30;
  const credit = Math.round(subTotal() * (daysLeft / cycleDays));
  const dueToday = s.yearly - credit;

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Mudar para anual']} navigate={navigate}>
      <PageHeader title="Mudar para o plano anual" sub={`${p.name} · ${SUB.units} lojas · hoje você paga ${brl(subTotal())} por mês`} />
      <Page width={980}>
        <div className="split-aside" style={{ '--aside': '330px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 22, borderColor: 'var(--accent)' }}>
              <span className="badge badge-accent" style={{ marginBottom: 12 }}>{ANNUAL.freeMonths} meses grátis</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.035em' }}>{brl(s.save)}</span>
                <span style={{ fontSize: 14, color: 'var(--fg-muted)' }}>de economia por ano · {s.pct.toFixed(0)}% a menos</span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 560 }}>
                No mensal você paga {brl(s.monthly)} ao longo de 12 meses. No anual são {brl(s.yearly)} de uma vez —
                o equivalente a 10 mensalidades.
              </p>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>O que muda além do preço</h3>
              </div>
              <div style={{ padding: '6px 18px 14px' }}>
                {ANNUAL.perks.map(([t, d], i) => (
                  <div key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 0', borderBottom: i < ANNUAL.perks.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                    <span style={{ color: 'var(--success)', display: 'flex', marginTop: 2 }}><I.Check size={14} stroke={2.4} /></span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.5 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormCard title="Forma de pagamento" desc="No anual o boleto fica disponível." cols={1}>
              <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                {[{ k: 'card', l: 'Cartão' }, { k: 'pix', l: 'PIX' }, { k: 'boleto', l: 'Boleto' }].map(o => (
                  <button key={o.k} onClick={() => setMethod(o.k)} style={{
                    flex: 1, background: method === o.k ? 'var(--bg-elev)' : 'transparent',
                    border: '1px solid ' + (method === o.k ? 'var(--line)' : 'transparent'),
                    borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                    color: method === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                  }}>{o.l}</button>
                ))}
              </div>
              <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                {method === 'card' && <>Cobrança única de {brl(dueToday)} no {SUB.card}. Parcelamos em até 12× sem juros se preferir.</>}
                {method === 'pix' && <>QR Code gerado na confirmação. O ciclo anual começa assim que o pagamento cai, em segundos.</>}
                {method === 'boleto' && <>Boleto com 5 dias de prazo, enviado para financeiro@bonsucesso.com.br. O plano mensal segue ativo até a compensação.</>}
              </div>
            </FormCard>
          </div>

          <div className="card" data-sticky style={{ padding: 18, position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Resumo</div>
            <SummaryRow label={`${p.name} anual · ${SUB.units} lojas`} value={brl(s.yearly)} />
            <SummaryRow label={`Crédito dos ${daysLeft} dias pagos`} value={'− ' + brl(credit)} tone="success" />
            <div style={{ borderTop: '1px solid var(--line)', margin: '10px 0' }}></div>
            <SummaryRow label="Cobrado hoje" value={brl(dueToday)} strong />
            <SummaryRow label="Próxima cobrança" value="19 set 2027" />
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 7, fontSize: 11.5, color: 'var(--accent-text)', fontWeight: 500, lineHeight: 1.5 }}>
              Economia de {brl(s.save)} no primeiro ano e preço travado até setembro de 2027.
            </div>
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
              Confirmar plano anual
            </button>
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-ghost" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>Continuar no mensal</button>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Cancelando antes do fim do ano, devolvemos os meses não usados pelo preço mensal cheio. Sem pegadinha.
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
