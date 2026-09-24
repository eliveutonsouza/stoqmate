"use client";

import { Sparkline } from '@/components/domain/sparkline';

export function MetricsRow({ metrics }) {
  return (
    <div className="g4 kpi-strip">
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding: '16px 18px', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', letterSpacing: '-0.005em' }}>{m.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
            {m.delta && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: m.trend === 'up' ? 'var(--success)' : 'var(--danger)' }}>{m.delta}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
            {m.spark?.length > 1 && <Sparkline data={m.spark} color={m.trend === 'up' ? 'var(--success)' : m.trend === 'down' ? 'var(--danger)' : 'var(--fg-muted)'} width={60} height={18} />}
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
