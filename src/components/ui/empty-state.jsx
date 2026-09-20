"use client";


export function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{
      padding: '48px 24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 9,
        background: 'var(--bg-sunken)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg-soft)', marginBottom: 4,
      }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-muted)', maxWidth: 320, lineHeight: 1.5 }}>{desc}</div>
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

// === Table toolbar ===
