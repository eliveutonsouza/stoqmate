"use client";

import { AIChip } from '@/features/ai/ai-chip';

export function AIThinking({ label = 'Analisando…', detail }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: 'var(--accent-soft)',
      border: '1px solid var(--accent)', borderRadius: 8,
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        border: '2px solid var(--accent)', borderTopColor: 'transparent',
        animation: 'aiSpin 700ms linear infinite',
      }}></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{label}</div>
        {detail && <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{detail}</div>}
      </div>
      <AIChip />
    </div>
  );
}
