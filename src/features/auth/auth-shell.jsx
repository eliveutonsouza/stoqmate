"use client";

import { I } from '@/components/icons';

export function AuthShell({ children, aside, navigate }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg)', color: 'var(--fg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 40px' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <I.Brand size={22} />
          <I.Wordmark size={15} />
        </a>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>{children}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-soft)', display: 'flex', gap: 14 }}>
          <span>© 2026 Stoqmate</span><span>Termos</span><span>Privacidade</span><span>LGPD</span>
        </div>
      </div>
      <div style={{
        background: 'var(--bg-sunken)',
        borderLeft: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, overflow: 'hidden',
      }}>{aside}</div>
    </div>
  );
}
