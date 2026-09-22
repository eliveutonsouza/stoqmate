"use client";

import { I } from '@/components/icons';
import { EmptyState } from '@/components/ui/empty-state';

export function CategoryMixCard({ navigate, byCategory }) {
  const total = byCategory.reduce((s, c) => s + Number(c.revenue), 0);
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por categoria</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Participação de cada linha no faturamento, 30 dias.</p>
        </div>
        <button onClick={() => navigate('/reports/categories')} className="btn btn-ghost btn-sm">Detalhar <I.ChevronRight size={12} /></button>
      </div>

      {byCategory.length === 0 ? (
        <EmptyState icon={<I.ChartBar size={18} />} title="Sem vendas no período" desc="A participação por categoria aparece assim que houver vendas." />
      ) : (
        <>
          <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
            {byCategory.map((m, i) => (
              <div key={m.category_id} title={m.name} style={{
                width: `${(m.revenue / total) * 100}%`,
                background: m.color || 'var(--fg-faint)',
                borderRight: i < byCategory.length - 1 ? '1px solid var(--bg-elev)' : 'none',
              }}></div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {byCategory.map((m) => {
              const Ico = I[m.icon] || I.Box;
              return (
                <div key={m.category_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: m.color, display: 'flex', flexShrink: 0 }}><Ico size={14} /></span>
                  <span style={{ fontSize: 12, flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                    {Number(m.units).toLocaleString('pt-BR')} {m.unit_plural}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 78, textAlign: 'right' }}>
                    R$ {Number(m.revenue).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 34, textAlign: 'right' }}>
                    {((m.revenue / total) * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
