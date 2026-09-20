"use client";


export function Field({ label, hint, required, error, children, span }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: 'var(--accent-text)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{hint}</span>}
    </div>
  );
}
