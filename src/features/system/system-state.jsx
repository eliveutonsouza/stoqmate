"use client";


export function SystemState({ navigate, icon, tone = 'muted', code, title, body, primary, secondary, extra }) {
  const toneColor = { muted: 'var(--fg-soft)', danger: 'var(--danger)', warning: 'var(--warning)', info: 'var(--info)' }[tone];
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, margin: '0 auto 20px',
          background: 'var(--bg-elev)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: toneColor,
        }}>{icon}</div>
        {code && <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-faint)', marginBottom: 8 }}>{code}</div>}
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>{title}</h1>
        <p style={{ margin: '10px auto 0', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.65, maxWidth: 420 }}>{body}</p>
        {extra}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {primary}
          {secondary}
        </div>
      </div>
    </div>
  );
}

// === 404 ===
