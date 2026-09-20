"use client";

import { I } from '@/components/icons';

export function ReviewActions({ onAccept, onReject, accepted, rejected, compact }) {
  if (accepted) return <span className="badge badge-success"><I.Check size={10} stroke={3} /> Aceito</span>;
  if (rejected) return <span className="badge">Descartado</span>;
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      <button onClick={onReject} className="btn btn-ghost btn-sm" style={{ padding: '0 7px' }} title="Descartar sugestão">
        <I.X size={12} />
      </button>
      <button onClick={onAccept} className="btn btn-primary btn-sm">
        <I.Check size={11} stroke={2.6} /> {compact ? '' : 'Aceitar'}
      </button>
    </div>
  );
}

// "Why did the model say that" — non-negotiable next to any suggestion.
