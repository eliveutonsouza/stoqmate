"use client";

import * as React from 'react';
import { I } from '@/components/icons';

const MENU_WIDTH = 184;

// Menu "•••" de linha de tabela; `icon` troca o gatilho para menus curtos do
// chrome (unidade, conta). position: fixed (e não absolute) porque as tabelas
// moram dentro de .card com overflow: hidden, que cortaria o menu nas
// últimas linhas.
export function RowMenu({ items, label = 'Ações', icon }) {
  const [pos, setPos] = React.useState(null);
  const buttonRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => { if (e.key === 'Escape') { close(); buttonRef.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    menuRef.current?.querySelector('button:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  const toggle = (e) => {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const r = buttonRef.current.getBoundingClientRect();
    const openUp = r.bottom + 40 * items.length + 12 > window.innerHeight;
    setPos({
      left: Math.max(8, r.right - MENU_WIDTH),
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  };

  const run = (item) => (e) => {
    e.stopPropagation();
    setPos(null);
    item.onSelect();
  };

  return (
    <>
      <button ref={buttonRef} onClick={toggle} aria-label={label} aria-haspopup="menu" aria-expanded={!!pos} className="btn btn-ghost btn-icon btn-sm">
        {icon ?? <I.More size={13} />}
      </button>
      {pos && (
        <div ref={menuRef} role="menu" style={{
          position: 'fixed', ...pos, width: MENU_WIDTH, zIndex: 60,
          background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8,
          boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.12))', padding: 4,
        }}>
          {items.map((item) => (
            <button key={item.label} role="menuitem" onClick={run(item)} disabled={item.disabled}
              style={{
                display: 'flex', alignItems: 'center', width: '100%', height: 32, padding: '0 10px',
                background: 'transparent', border: 'none', borderRadius: 5, textAlign: 'left',
                fontSize: 12.5, fontFamily: 'inherit', cursor: item.disabled ? 'default' : 'pointer',
                color: item.tone === 'danger' ? 'var(--danger)' : 'var(--fg)', opacity: item.disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onFocus={(e) => { e.currentTarget.style.background = 'var(--bg-sunken)'; }}
              onBlur={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
