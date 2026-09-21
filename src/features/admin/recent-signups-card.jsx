"use client";

import { I } from '@/components/icons';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';
import { StatusBadge } from '@/components/domain/status-badge';

export function RecentSignupsCard({ navigate, signups }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastros recentes</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>As 6 redes mais novas da plataforma.</p>
        </div>
        <button onClick={() => navigate('/admin/stores')} className="btn btn-ghost btn-sm">Todas as redes <I.ChevronRight size={12} /></button>
      </div>
      {signups.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma rede ainda.</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Rede</th><th>Segmento</th><th>Cidade</th><th>Plano</th><th>Status</th></tr>
          </thead>
          <tbody>
            {signups.map((s) => (
              <tr key={s.id}>
                <td>
                  <button onClick={() => navigate(`/admin/stores/detail?id=${s.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <StoreAvatar name={s.name} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{s.name}</span>
                  </button>
                </td>
                <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.segment || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.city || '—'}</td>
                <td><PlanBadge plan={s.planName} /></td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
