"use client";


export function Lead({ children, max = 620 }) {
  return (
    <p className="lp-lead" style={{
      margin: '14px 0 0', color: 'var(--fg-muted)',
      lineHeight: 1.6, maxWidth: max, textWrap: 'pretty',
    }}>{children}</p>
  );
}

// === 1 · HERO ===
