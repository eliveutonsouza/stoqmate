"use client";

import * as React from 'react';
import Link from 'next/link';
import { I } from '@/components/icons';
import { isModifiedClick } from '@/components/layout/sidebar-item';

export function SidebarGroup({ icon, label, items, route, navigate, badge }) {
  const childActive = items.some(it => it.r === route);
  const [manualOpen, setManualOpen] = React.useState(null);
  const open = manualOpen ?? childActive;
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setManualOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 16px)',
        padding: '0 10px', height: 30, margin: '0 8px', borderRadius: 5,
        border: 'none', background: 'transparent', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
        color: childActive ? 'var(--fg)' : 'var(--fg-muted)',
        fontSize: 13, fontWeight: childActive ? 500 : 400,
        letterSpacing: '-0.005em',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: childActive ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge && <span className="badge" style={{ fontSize: 10, padding: '1px 5px' }}>{badge}</span>}
        <span style={{ color: 'var(--fg-faint)', display: 'flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms ease' }}>
          <I.ChevronRight size={12} />
        </span>
      </button>
      {open && (
        <div style={{ margin: '2px 8px 2px 26px', paddingLeft: 10, borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map(it => {
            const active = route === it.r;
            return (
              <Link key={it.r} href={it.r} aria-current={active ? 'page' : undefined} onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                navigate(it.r);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 8px', height: 26, borderRadius: 4,
                color: active ? 'var(--fg)' : 'var(--fg-muted)',
                background: active ? 'var(--bg-elev)' : 'transparent',
                border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
                fontSize: 12.5, fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ flex: 1 }}>{it.l}</span>
                {it.b && <span style={{ fontSize: 10, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>{it.b}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// === Store Sidebar ===
