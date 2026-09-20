"use client";


export function PlanBadge({ plan }) {
  const m = {
    'Balcão': { bg: 'var(--bg-sunken)', fg: 'var(--fg-muted)' },
    'Controle': { bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
    'Rede': { bg: 'var(--fg)', fg: 'var(--bg)' },
  };
  const s = m[plan] || m['Balcão'];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px',
      background: s.bg, color: s.fg,
      borderRadius: 4, fontSize: 11, fontWeight: 500,
    }}>{plan}</span>
  );
}
