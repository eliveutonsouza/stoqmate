"use client";

import { I } from '@/components/icons';

export function AIError({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', background: 'var(--danger-soft)',
      border: '1px solid var(--danger)', borderRadius: 8,
    }}>
      <span style={{ color: 'var(--danger)', flexShrink: 0 }}><I.Alert size={15} /></span>
      <div style={{ flex: 1, fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>
        Não foi possível concluir a análise. <span style={{ color: 'var(--fg-muted)' }}>{message}</span>
      </div>
      {onRetry && <button onClick={onRetry} className="btn btn-outline btn-sm">Tentar de novo</button>}
    </div>
  );
}

// Store-facing quota. Shows actions against the plan allowance — never dollars.
