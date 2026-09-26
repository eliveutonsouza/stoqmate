"use client";

import { useFieldId } from '@/components/ui/field';

export function TextInput({ prefix, suffix, mono, id, ...p }) {
  const inputId = useFieldId(id);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && <span style={{ position: 'absolute', left: 10, fontSize: 12, color: 'var(--fg-muted)', pointerEvents: 'none', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{prefix}</span>}
      <input className="input" id={inputId} {...p} style={{
        paddingLeft: prefix ? 16 + String(prefix).length * 8 : 10,
        paddingRight: suffix ? 16 + String(suffix).length * 7 : 10,
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        ...(p.style || {}),
      }} />
      {suffix && <span style={{ position: 'absolute', right: 10, fontSize: 12, color: 'var(--fg-muted)', pointerEvents: 'none' }}>{suffix}</span>}
    </div>
  );
}
