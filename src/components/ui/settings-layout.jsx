"use client";

import { usePathname } from 'next/navigation';
import { I } from '@/components/icons';

export function SettingsLayout({ navigate, children }) {
  const pathname = usePathname();
  const items = [
    { r: '/settings', l: 'Visão geral', i: <I.Grid size={14} /> },
    { r: '/settings/branding', l: 'Branding', i: <I.Sparkle size={14} /> },
    { r: '/settings/store-data', l: 'Dados da empresa', i: <I.Store size={14} /> },
    { r: '/settings/units', l: 'Unidades da rede', i: <I.Swap size={14} /> },
    { r: '/settings/users', l: 'Usuários', i: <I.Users size={14} /> },
    { r: '/settings/roles', l: 'Perfis e permissões', i: <I.Shield size={14} /> },
    { r: '/settings/audit', l: 'Log de alterações', i: <I.Activity size={14} /> },
    { r: '/settings/subscription', l: 'Plano e assinatura', i: <I.Credit size={14} /> },
    { r: '/settings/credits', l: 'Créditos de IA', i: <I.Sparkle size={14} /> },
    { r: '/settings/billing', l: 'Cobrança', i: <I.Chart size={14} /> },
    { r: '/profile', l: 'Meu perfil', i: <I.Shield size={14} /> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '208px minmax(0, 1fr)', gap: 28, padding: '20px 28px 48px', alignItems: 'start' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 0 }}>
        {items.map(it => {
          const active = pathname === it.r;
          return (
            <a key={it.r} href="#" onClick={(e) => { e.preventDefault(); navigate(it.r); }} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 6,
              background: active ? 'var(--bg-elev)' : 'transparent',
              border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
              color: active ? 'var(--fg)' : 'var(--fg-muted)',
              fontSize: 13, fontWeight: active ? 500 : 400,
            }}>
              <span style={{ color: active ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex' }}>{it.i}</span>
              {it.l}
            </a>
          );
        })}
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// === Modal ===
