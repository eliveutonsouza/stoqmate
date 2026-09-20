"use client";


export function Eyebrow({ children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 600, color: 'var(--accent-text)',
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
    }}>{children}</div>
  );
}
