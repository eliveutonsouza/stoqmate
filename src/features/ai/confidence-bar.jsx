"use client";


export function ConfidenceBar({ value, width = 64 }) {
  const tone = value >= 90 ? 'var(--success)' : value >= 75 ? 'var(--warning)' : 'var(--danger)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width, height: 4, background: 'var(--bg-sunken)', borderRadius: 2, display: 'inline-block' }}>
        <span style={{ display: 'block', width: `${value}%`, height: '100%', background: tone, borderRadius: 2 }}></span>
      </span>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: tone, minWidth: 30 }}>{value}%</span>
    </span>
  );
}

// Loading state that says what the model is doing, not a bare spinner.
