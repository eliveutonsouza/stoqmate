"use client";

import { MOCK } from '@/lib/mock';
import { PLATFORM } from '@/lib/plans';

export function MRRGrowthCard() {
  // build twin series: current + previous period
  const cur = MOCK.adminMetrics[0].spark;
  const prev = cur.map((v, i) => v * 0.78 + Math.sin(i * 1.7) * 4 + 6);

  const w = 600, h = 200;
  const max = Math.max(...cur, ...prev);
  const min = Math.min(...cur, ...prev);
  const toPath = (arr) => arr.map((v, i) => {
    const x = (i / (arr.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 24) - 12;
    return (i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }).join(' ');

  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Crescimento de MRR</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Receita recorrente mensal nos últimos 12 meses.</p>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 2, background: 'var(--accent)' }}></span> 2026
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 2, background: 'var(--fg-faint)' }}></span> 2025
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{PLATFORM.fmt(PLATFORM.mrr)}</span>
        <span style={{ fontSize: 12, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+9,2% MoM</span>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>· {PLATFORM.fmt(PLATFORM.arr)} ARR</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" y1={h * p + 12} x2={w} y2={h * p + 12} stroke="var(--line-soft)" strokeDasharray="2 4" />
        ))}
        <path d={toPath(prev)} stroke="var(--fg-faint)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
        <path d={toPath(cur) + ` L${w},${h} L0,${h} Z`} fill="url(#adminGrad)" />
        <path d={toPath(cur)} stroke="var(--accent)" strokeWidth="1.8" fill="none" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
        {['Jun','Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai'].map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}
