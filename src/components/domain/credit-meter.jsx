"use client";


export function CreditMeter({ used, total, height = 8 }) {
  const pct = Math.min(100, (used / total) * 100);
  const tone = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent-strong)';
  return (
    <div style={{ height, background: 'var(--bg-sunken)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: tone, borderRadius: height / 2 }}></div>
    </div>
  );
}

// === /settings/credits ===
