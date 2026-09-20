"use client";

import { I } from '@/components/icons';
import { MOCK } from '@/lib/mock';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { CategoryBadge } from '@/components/ui/category-badge';

export function RecentMovementsCard({ navigate }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Atividade recente</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Últimas movimentações desta unidade.</p>
        </div>
        <button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">
          Ver histórico completo <I.ChevronRight size={12} />
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 72 }}>Hora</th>
            <th style={{ width: 130 }}>Tipo</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th className="num">Qtd</th>
            <th className="num">Valor</th>
            <th>Por</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {MOCK.movements.map((m, i) => {
            const t = MOVEMENT_TYPES[m.type];
            return (
              <tr key={i}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{m.time}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 7px', borderRadius: 4,
                    background: t.soft, color: t.color, fontSize: 11, fontWeight: 500,
                  }}>{t.icon} {t.label}</span>
                </td>
                <td style={{ fontSize: 13 }}>{m.desc}</td>
                <td><CategoryBadge cat={m.cat} /></td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.qty > 0 ? 'var(--success)' : m.qty < 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                  {m.qty > 0 ? '+' : ''}{m.qty || '—'}
                </td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.value}</td>
                <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.user}</td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
