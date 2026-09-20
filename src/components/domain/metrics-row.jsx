"use client";

import { Sparkline } from '@/components/domain/sparkline';

export function MetricsRow({ metrics }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      background: 'var(--bg-elev)', border: '1px solid var(--line)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding: '16px 18px',
          borderRight: i < metrics.length - 1 ? '1px solid var(--line)' : 'none',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', letterSpacing: '-0.005em' }}>{m.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: m.trend === 'up' ? 'var(--success)' : 'var(--danger)' }}>{m.delta}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <Sparkline data={m.spark} color={m.trend === 'up' ? 'var(--success)' : 'var(--danger)'} width={60} height={18} />
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
