"use client";

import { I } from '@/components/icons';

export function CaptureCard({ item, onFix }) {
  const tone = item.conf >= 85 ? 'success' : item.conf >= 65 ? 'warning' : 'danger';
  const toneVar = { success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)' }[tone];
  if (item.state === 'processing') {
    return (
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 9, width: '62%', background: 'rgba(255,255,255,0.14)', borderRadius: 4 }}></div>
          <div style={{ height: 8, width: '40%', background: 'rgba(255,255,255,0.09)', borderRadius: 4, marginTop: 7 }}></div>
        </div>
        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>lendo…</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <I.Pkg size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{item.name}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{item.brand} · {item.attrs}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: toneVar }}></span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>{item.conf}% de confiança</span>
          {item.state === 'review' && (
            <button onClick={onFix} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: '#fff', background: 'rgba(255,255,255,0.14)', border: 'none', borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit' }}>
              Revisar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
