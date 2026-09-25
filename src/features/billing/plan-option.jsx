"use client";

import { brl } from '@/lib/format';
import { I } from '@/components/icons';

// Cartão de plano (dados de `plans` via queries.ts) reutilizado na troca de
// plano, no fim do teste, na reativação e no checkout. Preço é por
// assinatura — o Checkout cobra quantidade 1, não por loja.
export function PlanOption({ plan, selected, onSelect, current, cycle = 'monthly', disabled }) {
  const yearly = cycle === 'yearly' && plan.yearly != null;
  return (
    <button type="button" onClick={onSelect} disabled={disabled} aria-pressed={selected} style={{
      display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', width: '100%',
      padding: '13px 15px', borderRadius: 9,
      border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--line)'),
      background: selected ? 'var(--accent-soft)' : 'var(--bg-elev)',
      opacity: disabled ? 0.6 : 1,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{plan.name}</span>
        {current && <span className="badge badge-info">Plano atual</span>}
        {plan.popular && !current && <span className="badge badge-accent">Mais assinado</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 19, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', color: 'var(--fg)' }}>{brl(yearly ? plan.yearly : plan.monthly)}</span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{yearly ? '/ano' : '/mês'}</span>
      </span>
      {plan.who && <span style={{ fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{plan.who}</span>}
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--accent-text)', fontWeight: 500, marginTop: 2 }}>
        <I.Sparkle size={11} /> {plan.credits.toLocaleString('pt-BR')} créditos de IA/mês
      </span>
    </button>
  );
}
