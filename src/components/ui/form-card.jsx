"use client";


export function FormCard({ title, desc, children, footer, cols = 2 }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {(title || desc) && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          {title && <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>}
          {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{desc}</p>}
        </div>
      )}
      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14 }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunken)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// Two-column layout: settings nav + content
