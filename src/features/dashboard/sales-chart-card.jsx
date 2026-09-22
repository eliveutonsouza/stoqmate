"use client";

import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { brl } from '@/lib/format';

export function SalesChartCard({ salesSeries, revenue, delta }) {
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por dia</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Últimos 30 dias, todas as categorias.</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{brl(revenue)}</span>
        {delta !== null && (
          <span style={{ fontSize: 12, color: delta >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs período anterior
          </span>
        )}
      </div>
      {salesSeries.length > 1 ? (
        <MiniAreaChart data={salesSeries} height={180} />
      ) : (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 12.5 }}>
          Sem vendas suficientes no período pra montar o gráfico.
        </div>
      )}
    </div>
  );
}
