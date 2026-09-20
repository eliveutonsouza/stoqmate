"use client";


export function AIWhy({ reasons }) {
  return (
    <div style={{
      padding: '11px 13px', background: 'var(--bg-sunken)',
      border: '1px solid var(--line)', borderRadius: 7,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>
        Por que a IA sugeriu isso
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {reasons.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}>·</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
