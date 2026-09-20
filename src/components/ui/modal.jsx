"use client";

import { I } from '@/components/icons';

export function Modal({ open, onClose, title, desc, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(20, 18, 13, 0.4)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        width, maxWidth: '100%', maxHeight: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</h3>
            {desc && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{desc}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><I.X size={14} /></button>
        </div>
        <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        {footer && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunken)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// === Empty state ===
