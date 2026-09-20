"use client";

import * as React from 'react';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { MOCK } from '@/lib/mock';

export function SalesChartCard() {
  const [range, setRange] = React.useState('30d');
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por dia</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Todas as categorias desta unidade.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 6, padding: 2 }}>
          {['7d', '30d', '90d'].map(k => (
            <button key={k} onClick={() => setRange(k)} style={{
              background: range === k ? 'var(--bg-elev)' : 'transparent',
              border: 'none', borderRadius: 4, padding: '3px 10px',
              fontSize: 11, fontWeight: 500, color: 'var(--fg)',
              boxShadow: range === k ? 'var(--shadow-xs)' : 'none',
            }}>{k}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>R$ 412.680</span>
        <span style={{ fontSize: 12, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+12,4% vs período anterior</span>
      </div>
      <MiniAreaChart data={MOCK.salesSeries} height={180} />
    </div>
  );
}
