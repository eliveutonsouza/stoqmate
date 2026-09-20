"use client";


export function OnbTitle({ title, desc }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.028em', lineHeight: 1.15 }}>{title}</h1>
      <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{desc}</p>
    </div>
  );
}
