"use client";


export function SidebarItem({ icon, label, active, onClick, badge, shortcut }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick && onClick(); }} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 10px',
      height: 30,
      margin: '0 8px',
      borderRadius: 5,
      color: active ? 'var(--fg)' : 'var(--fg-muted)',
      background: active ? 'var(--bg-elev)' : 'transparent',
      boxShadow: active ? 'var(--shadow-xs)' : 'none',
      border: active ? '1px solid var(--line)' : '1px solid transparent',
      fontSize: 13,
      fontWeight: active ? 500 : 400,
      letterSpacing: '-0.005em',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: active ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span className="badge badge-accent" style={{ fontSize: 10, padding: '1px 5px' }}>{badge}</span>}
      {shortcut && <span className="kbd" style={{ fontSize: 10, minWidth: 14, height: 16 }}>{shortcut}</span>}
    </a>
  );
}
