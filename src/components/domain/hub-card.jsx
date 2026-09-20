"use client";

import { I } from '@/components/icons';

export function HubCard({ icon, title, desc, meta, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left',
      padding: 18, background: 'var(--bg-elev)',
      border: '1px solid var(--line)', borderRadius: 10, width: '100%',
      transition: 'border-color 80ms ease, background 80ms ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-elev)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%' }}>
        <span style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: accent ? 'var(--accent-soft)' : 'var(--bg-sunken)',
          color: accent ? 'var(--accent-text)' : 'var(--fg-muted)',
          border: '1px solid ' + (accent ? 'transparent' : 'var(--line)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, letterSpacing: '-0.012em', color: 'var(--fg)' }}>{title}</span>
        <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><I.ArrowRight size={14} /></span>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{desc}</p>
      {meta && (
        <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 14, width: '100%' }}>
          {meta.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: 2, color: 'var(--fg)' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// === /stock — estoque overview ===
