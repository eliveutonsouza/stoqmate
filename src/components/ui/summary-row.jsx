"use client";


export function SummaryRow({ label, value, strong, tone }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <span style={{ fontSize: strong ? 13 : 12, color: strong ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: strong ? 500 : 400 }}>{label}</span>
      <span style={{
        fontSize: strong ? 18 : 13,
        fontWeight: strong ? 600 : 400,
        fontFamily: 'var(--font-mono)',
        letterSpacing: strong ? '-0.015em' : 0,
        color: tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--fg)',
      }}>{value}</span>
    </div>
  );
}
