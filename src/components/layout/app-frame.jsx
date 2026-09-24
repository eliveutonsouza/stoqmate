"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { layoutStyles } from '@/components/layout/layout-styles';

// Sidebar fixa no desktop; abaixo de 900px vira drawer (CSS em
// design-system.css, .app-shell/.app-sidebar). O estado guarda em qual
// rota o drawer foi aberto: navegar pra outra rota já fecha, sem efeito.
export function AppFrame({ sidebar, renderHeader, children, overlay }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = React.useState(null);
  const open = openAt === pathname;
  const close = React.useCallback(() => setOpenAt(null), []);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div className="app-shell" data-drawer={open ? 'open' : 'closed'}>
      <div className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-sunken)' }}>
        {sidebar}
      </div>
      <div className="app-drawer-backdrop" onClick={close} aria-hidden="true"></div>
      <div style={layoutStyles.main}>
        {renderHeader({ onMenu: () => setOpenAt(open ? null : pathname), menuOpen: open })}
        <div style={layoutStyles.content} data-content-area>{children}</div>
      </div>
      {overlay}
    </div>
  );
}
