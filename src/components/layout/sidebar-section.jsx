"use client";


export function SidebarSection({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{
        fontSize: 10, fontWeight: 500, color: 'var(--fg-soft)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '0 18px 6px',
      }}>{label}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
    </div>
  );
}

// Collapsible group with child routes
