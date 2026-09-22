"use client";

import { I } from '@/components/icons';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { CategoryBadge } from '@/components/ui/category-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';

export function RecentMovementsCard({ navigate, movements }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Atividade recente</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Últimas movimentações da rede.</p>
        </div>
        <button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">
          Ver histórico completo <I.ChevronRight size={12} />
        </button>
      </div>
      {movements.length === 0 ? (
        <EmptyState icon={<I.Activity size={18} />} title="Nenhuma movimentação ainda" desc="Entradas, vendas e ajustes aparecem aqui assim que forem confirmados." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 96 }}>Hora</th>
              <th style={{ width: 130 }}>Tipo</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Unidade</th>
              <th className="num">Qtd</th>
              <th className="num">Valor</th>
              <th>Por</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const t = MOVEMENT_TYPES[m.kind] ?? MOVEMENT_TYPES.adjustment;
              const value = m.qty ? Math.abs(m.qty) * (m.unit_price ?? m.unit_cost ?? 0) : null;
              return (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 7px', borderRadius: 4,
                      background: t.soft, color: t.color, fontSize: 11, fontWeight: 500,
                    }}>{t.icon} {t.label}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{m.product?.name ?? '—'}</td>
                  <td>{m.product?.category && <CategoryBadge category={m.product.category} />}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.store?.name}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.qty > 0 ? 'var(--success)' : m.qty < 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                    {m.qty > 0 ? '+' : ''}{m.qty || '—'}
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value ? brl(value) : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.byName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
