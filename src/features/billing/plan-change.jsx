"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { SUB, subPlan, subTotal } from '@/features/billing/billing-state';
import { PLANS, annualSavings } from '@/lib/plans';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { brl } from '@/lib/format';
import { Page } from '@/components/ui/page-container';
import { PlanOption } from '@/features/billing/plan-option';
import { I } from '@/components/icons';
import { SummaryRow } from '@/components/ui/summary-row';

export function PlanChange() {
  const navigate = useNavigate();
  const [target, setTarget] = React.useState('rede');
  const cur = subPlan();
  const next = PLANS.find(p => p.id === target);
  const up = next.monthly > cur.monthly;
  const same = next.id === cur.id;
  const daysLeft = 12, cycleDays = 30;
  const prorata = Math.max(0, Math.round((next.monthly - cur.monthly) * SUB.units * (daysLeft / cycleDays)));

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Trocar de plano']} navigate={navigate}>
      <PageHeader title="Trocar de plano" sub={`Hoje: ${cur.name} · ${SUB.units} lojas · ${brl(subTotal())}/mês`} />
      <Page width={980}>
        <div className="split-aside" style={{ '--aside': '320px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLANS.map(p => (
              <PlanOption key={p.id} plan={p} units={SUB.units} current={p.id === cur.id} selected={p.id === target} onSelect={() => setTarget(p.id)} />
            ))}
            <div className="card" style={{ padding: 16, display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--accent-text)', display: 'flex', marginTop: 1 }}><I.Sparkle size={15} /></span>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                Só precisa de mais IA, não de mais recursos? Um pacote de créditos sai mais barato que subir de plano.{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings/credits'); }}>Ver pacotes</a>.
              </div>
            </div>
          </div>

          <div className="card" data-sticky style={{ padding: 18, position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Resumo da troca</div>
            <SummaryRow label="Plano atual" value={`${cur.name} · ${brl(subTotal())}`} />
            <SummaryRow label="Novo plano" value={`${next.name} · ${brl(next.monthly * SUB.units)}`} />
            <SummaryRow label="Créditos de IA/mês" value={`${cur.credits.toLocaleString('pt-BR')} → ${next.credits.toLocaleString('pt-BR')}`} />
            <div style={{ borderTop: '1px solid var(--line)', margin: '10px 0' }}></div>
            {same ? (
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>Este já é o seu plano.</div>
            ) : up ? (
              <>
                <SummaryRow label={`Diferença pro rata (${daysLeft} dias)`} value={brl(prorata)} strong />
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55, marginTop: 8 }}>
                  Cobrado hoje no {SUB.card}. Os novos créditos entram na hora e o ciclo cheio de {brl(next.monthly * SUB.units)} começa em {SUB.nextCharge}.
                </div>
              </>
            ) : (
              <>
                <SummaryRow label="Cobrado hoje" value="R$ 0,00" strong />
                <div style={{ fontSize: 11.5, color: 'var(--warning)', lineHeight: 1.55, marginTop: 8 }}>
                  A redução vale a partir de {SUB.nextCharge} — você não perde nada do que já pagou.
                </div>
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>O que sai do ar:</strong> transferência entre lojas, previsão de demanda e leitura de nota por foto. Seus dados continuam intactos.
                </div>
              </>
            )}
            <button disabled={same} onClick={() => navigate('/settings/subscription')} className="btn btn-primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center', opacity: same ? 0.5 : 1 }}>
              {up ? `Confirmar upgrade · ${brl(prorata)}` : 'Agendar mudança'}
            </button>
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-ghost" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>Voltar</button>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              No ciclo anual o {next.name} sai por {brl(next.yearly * SUB.units)} — {brl(annualSavings(next, SUB.units).save)} a menos que 12 mensalidades.{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings/subscription/annual'); }}>Ver anual</a>.
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /settings/subscription/cancel — o motivo escolhe a oferta ===
