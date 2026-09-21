"use client";

import { brl } from '@/lib/format';

export function MRRGrowthCard({ mrrTrend, currentMrr }) {
  const w = 600, h = 200;
  const values = mrrTrend.map((p) => Number(p.mrr));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const toPath = (arr) => arr.map((v, i) => {
    const x = arr.length > 1 ? (i / (arr.length - 1)) * w : 0;
    const y = h - ((v - min) / (max - min || 1)) * (h - 24) - 12;
    return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }).join(' ');

  // "2026-09-01" (date puro) vira meia-noite UTC — em fuso atrás de UTC isso
  // exibe o mês anterior. Mês vem direto do número na string, sem Date/fuso.
  const monthLabel = (isoDate) => {
    const month = Number(isoDate.split('-')[1]);
    return new Date(2000, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  };
  const prevMonth = values.length >= 2 ? values[values.length - 2] : null;
  const momPct = prevMonth ? ((currentMrr - prevMonth) / prevMonth) * 100 : null;

  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Crescimento de MRR</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Receita recorrente mensal — o histórico começa a partir de hoje, meses antigos aparecem zerados.</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{brl(currentMrr)}</span>
        {momPct != null && (
          <span style={{ fontSize: 12, color: momPct >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{momPct >= 0 ? '+' : ''}{momPct.toFixed(1)}% MoM</span>
        )}
      </div>
      {values.length === 0 ? (
        <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 12.5 }}>Sem histórico ainda.</div>
      ) : (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((p) => (
              <line key={p} x1="0" y1={h * p + 12} x2={w} y2={h * p + 12} stroke="var(--line-soft)" strokeDasharray="2 4" />
            ))}
            <path d={toPath(values) + ` L${w},${h} L0,${h} Z`} fill="url(#adminGrad)" />
            <path d={toPath(values)} stroke="var(--accent)" strokeWidth="1.8" fill="none" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            {mrrTrend.map((p) => <span key={p.month}>{monthLabel(p.month)}</span>)}
          </div>
        </>
      )}
    </div>
  );
}
