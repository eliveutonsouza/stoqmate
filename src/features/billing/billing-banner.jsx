"use client";

import { I } from '@/components/icons';

// Faixa de aviso das telas de exceção (cobrança pendente, conta cancelada,
// créditos esgotados). Só apresentação: título/texto chegam de dado real de
// quem usa.
export function BillingBanner({ tone = 'warning', icon = 'Credit', title, desc, action, onAction, actionDisabled, secondary, onSecondary }) {
  const Ico = I[icon] || I.Credit;
  const c = tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : 'var(--warning)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px', border: '1px solid ' + c, borderRadius: 9, background: 'var(--bg-elev)', flexWrap: 'wrap' }}>
      <span style={{ color: c, display: 'flex', flexShrink: 0 }}><Ico size={17} /></span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      {(action || secondary) && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {secondary && <button type="button" onClick={onSecondary} className="btn btn-ghost btn-sm">{secondary}</button>}
          {action && <button type="button" onClick={onAction} disabled={actionDisabled} className="btn btn-primary btn-sm" style={{ opacity: actionDisabled ? 0.6 : 1 }}>{action}</button>}
        </div>
      )}
    </div>
  );
}
