"use client";

import { MOVEMENT_TABS } from '@/features/stock/movement-tabs';

export function MovementNav({ route, navigate }) {
  return (
    <div className="no-bars" style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}>
      {MOVEMENT_TABS.map(t => {
        const active = route === t.r;
        return (
          <button key={t.r} onClick={() => navigate(t.r)} style={{
            background: active ? 'var(--bg-elev)' : 'transparent',
            border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
            borderRadius: 5, padding: '5px 12px', fontSize: 12.5, fontWeight: 500,
            color: active ? 'var(--fg)' : 'var(--fg-muted)',
            boxShadow: active ? 'var(--shadow-xs)' : 'none', whiteSpace: 'nowrap',
          }}>{t.l}</button>
        );
      })}
    </div>
  );
}
