"use client";

import { MOCK, catById } from '@/lib/mock';
import { I } from '@/components/icons';

export function CategoryMixCard({ navigate }) {
  const total = MOCK.categoryMix.reduce((s, c) => s + c.revenue, 0);
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por categoria</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Participação de cada linha no faturamento do mês.</p>
        </div>
        <button onClick={() => navigate('/reports/categories')} className="btn btn-ghost btn-sm">Detalhar <I.ChevronRight size={12} /></button>
      </div>

      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
        {MOCK.categoryMix.map((m, i) => (
          <div key={m.id} title={`${catById(m.id).name}`} style={{
            width: `${(m.revenue / total) * 100}%`,
            background: catById(m.id).cssVar,
            borderRight: i < MOCK.categoryMix.length - 1 ? '1px solid var(--bg-elev)' : 'none',
          }}></div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {MOCK.categoryMix.map(m => {
          const c = catById(m.id);
          const Ico = I[c.icon] || I.Box;
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: c.cssInk, display: 'flex', flexShrink: 0 }}><Ico size={14} /></span>
              <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                {m.units.toLocaleString('pt-BR')} {c.unitPlural}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 78, textAlign: 'right' }}>
                R$ {m.revenue.toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 34, textAlign: 'right' }}>
                {((m.revenue / total) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stock spread across the network — makes the multi-store model visible on day one.
