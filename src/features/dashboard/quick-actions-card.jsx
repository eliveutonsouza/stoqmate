"use client";

import * as React from 'react';
import { I } from '@/components/icons';
import { useShell } from '@/components/layout/shell-context';
import { can } from '@/lib/permissions';

const SHORTCUTS = {
  V: '/stock/sale', E: '/stock/entry', T: '/stock/transfer',
  N: '/products/new', A: '/stock/adjustment', P: '/promotions/new',
};

export function QuickActionsCard({ navigate }) {
  // Só as ações que o perfil consegue concluir (vendedor não lança entrada).
  const roleId = useShell()?.user?.roleId;
  const allowed = (route) => !roleId || can(roleId, route);
  // Atalhos que o card anuncia: tecla solta (sem Ctrl/⌘/Alt) fora de campo
  // de texto leva à ação.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const route = SHORTCUTS[e.key.toUpperCase()];
      if (!route || !allowed(route)) return;
      e.preventDefault();
      navigate(route);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, roleId]);

  const actions = [
    { icon: <I.Plus size={14} />, label: 'Nova venda', sub: 'Saída · balcão', kbd: 'V', r: '/stock/sale' },
    { icon: <I.Box size={14} />, label: 'Entrada de estoque', sub: 'Compra de fornecedor', kbd: 'E', r: '/stock/entry' },
    { icon: <I.Swap size={14} />, label: 'Transferir entre lojas', sub: 'Saída + entrada na rede', kbd: 'T', r: '/stock/transfer' },
    { icon: <I.Layers size={14} />, label: 'Cadastrar produto', sub: 'SKU por atributos', kbd: 'N', r: '/products/new' },
    { icon: <I.Activity size={14} />, label: 'Ajuste de inventário', sub: 'Conferência física', kbd: 'A', r: '/stock/adjustment' },
    { icon: <I.Tag size={14} />, label: 'Nova promoção', sub: 'Por período ou estoque', kbd: 'P', r: '/promotions/new' },
  ];
  return (
    <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Ações rápidas</h3>
        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Atalhos via teclado</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
        {actions.filter((a) => allowed(a.r)).map((a, i) => (
          <a key={i} href={a.r} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate(a.r); }} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', border: '1px solid var(--line)',
            borderRadius: 6, background: 'var(--bg-elev)',
            transition: 'background 80ms ease, border-color 80ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--line-strong)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elev)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            <span style={{
              width: 24, height: 24, borderRadius: 5,
              background: 'var(--accent-soft)', color: 'var(--accent-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{a.sub}</div>
            </div>
            <span className="kbd">{a.kbd}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Revenue split across categories — the view a single-vertical tool can't give you.
