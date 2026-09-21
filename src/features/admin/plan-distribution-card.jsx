"use client";

import { DonutChart } from '@/components/domain/donut-chart';

const COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)'];

export function PlanDistributionCard({ planDistribution }) {
  const total = planDistribution.reduce((s, p) => s + p.count, 0);

  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Distribuição por plano</h3>
      {total === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 12.5 }}>Nenhuma rede ainda.</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <DonutChart segments={planDistribution.map((p, i) => ({ value: p.count, color: COLORS[i % COLORS.length] }))} center={(
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{total}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>redes</div>
            </div>
          )} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {planDistribution.map((p, i) => {
              const pct = (p.count / total) * 100;
              return (
                <div key={p.planId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }}></span>
                  <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{p.planName}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{p.count} · {pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
