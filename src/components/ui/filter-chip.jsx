"use client";

import { I } from '@/components/icons';

export function FilterChip({ label, value }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 28, padding: '0 9px',
      background: 'var(--bg-elev)', border: '1px solid var(--line)',
      borderRadius: 5, fontSize: 12, color: 'var(--fg-muted)', cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <span style={{ color: 'var(--fg)' }}>{value}</span>
      <I.ChevronDown size={11} />
    </button>
  );
}

// === Categories & attribute schemas ===
