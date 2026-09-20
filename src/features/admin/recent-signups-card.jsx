"use client";

import { MOCK } from '@/lib/mock';
import { I } from '@/components/icons';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';
import { StatusBadge } from '@/components/domain/status-badge';

export function RecentSignupsCard({ navigate }) {
  const recent = MOCK.stores.filter(s => s.status === 'trial' || s.since.includes('Mai 2026') || s.since.includes('Abr 2025')).slice(0, 6);
  if (recent.length < 4) recent.push(...MOCK.stores.slice(0, 4));
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastros recentes</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Redes que entraram nos últimos 30 dias.</p>
        </div>
        <button onClick={() => navigate('/admin/stores')} className="btn btn-ghost btn-sm">Todas as redes <I.ChevronRight size={12} /></button>
      </div>
      <table className="table">
        <thead>
          <tr><th>Rede</th><th>Segmento</th><th>Cidade</th><th>Plano</th><th>Status</th></tr>
        </thead>
        <tbody>
          {recent.slice(0,6).map((s, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StoreAvatar name={s.name} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                </div>
              </td>
              <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.segment}</td>
              <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.city}</td>
              <td><PlanBadge plan={s.plan} /></td>
              <td><StatusBadge status={s.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
