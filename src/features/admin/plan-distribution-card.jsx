"use client";

import { MOCK } from '@/lib/mock';
import { DonutChart } from '@/components/domain/donut-chart';

export function PlanDistributionCard() {
  const total = MOCK.planDistribution.reduce((s, p) => s + p.count, 0);
  const mrrTotal = MOCK.planDistribution.reduce((s, p) => s + p.mrr, 0);
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Distribuição por plano</h3>

      {/* Donut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <DonutChart segments={MOCK.planDistribution.map(p => ({ value: p.count, color: p.color }))} center={(
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{total}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>lojas</div>
          </div>
        )} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK.planDistribution.map((p, i) => {
            const pct = (p.count / total) * 100;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }}></span>
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{p.count} · {pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)' }}>
        <span>MRR total</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--fg)' }}>R$ {mrrTotal.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}
