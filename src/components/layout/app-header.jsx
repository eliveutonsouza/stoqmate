"use client";

import * as React from 'react';
import { layoutStyles } from '@/components/layout/layout-styles';
import { I } from '@/components/icons';

export function AppHeader({ breadcrumb, actions, navigate, contextSwitch }) {
  return (
    <header style={layoutStyles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-muted)' }}>
        {breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--fg-faint)' }}><I.ChevronRight size={12} /></span>}
            <span style={{ color: i === breadcrumb.length - 1 ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>{b}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ flex: 1 }}></div>
      {contextSwitch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'var(--bg-sunken)', border: '1px solid var(--line)',
          borderRadius: 6, padding: 2,
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: contextSwitch === 'store' ? 'var(--bg-elev)' : 'transparent',
            border: 'none', borderRadius: 4, padding: '4px 9px',
            fontSize: 11, fontWeight: 500, color: 'var(--fg)',
            boxShadow: contextSwitch === 'store' ? 'var(--shadow-xs)' : 'none',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <I.Store size={11} /> Loja
          </button>
          <button onClick={() => navigate('/admin')} style={{
            background: contextSwitch === 'admin' ? 'var(--bg-elev)' : 'transparent',
            border: 'none', borderRadius: 4, padding: '4px 9px',
            fontSize: 11, fontWeight: 500, color: 'var(--fg)',
            boxShadow: contextSwitch === 'admin' ? 'var(--shadow-xs)' : 'none',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <I.Shield size={11} /> Admin
          </button>
        </div>
      )}
      {actions}
      <button onClick={() => navigate('/notifications')} className="btn btn-ghost btn-icon btn-sm" title="Notificações" style={{ position: 'relative' }}>
        <I.Bell size={14} />
        <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></span>
      </button>
    </header>
  );
}

// === Page header inside content ===
