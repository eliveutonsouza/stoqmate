"use client";

import { I } from '@/components/icons';

export function AIChip({ label = 'IA', size = 'sm' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-text)',
      fontSize: size === 'sm' ? 10.5 : 11.5, fontWeight: 600, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <I.Sparkle size={size === 'sm' ? 9 : 10} /> {label}
    </span>
  );
}

// Confidence is never decoration: below 80% the row defaults to manual review.
