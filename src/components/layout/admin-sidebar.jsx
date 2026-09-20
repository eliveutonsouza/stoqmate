"use client";

import { usePathname } from 'next/navigation';
import { layoutStyles } from '@/components/layout/layout-styles';
import { I } from '@/components/icons';
import { SidebarSection } from '@/components/layout/sidebar-section';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { SidebarGroup } from '@/components/layout/sidebar-group';
import { MOCK } from '@/lib/mock';

export function AdminSidebar({ navigate }) {
  const pathname = usePathname();
  const is = (r) => pathname === r;
  return (
    <aside style={layoutStyles.sidebar}>
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <I.Brand size={22} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.015em' }} className="truncate">Stoqmate Admin</div>
          <div style={{ fontSize: 11, color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <I.Shield size={10} /> Console
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <button className="btn btn-outline btn-sm" style={{
          width: '100%', justifyContent: 'flex-start',
          color: 'var(--fg-soft)', fontWeight: 400,
        }}>
          <I.Search size={13} />
          <span>Buscar redes, usuários…</span>
          <span style={{ flex: 1 }}></span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        <SidebarSection>
          <SidebarItem icon={<I.Home size={15} />} label="Overview" active={is('/admin')} onClick={() => navigate('/admin')} />
          <SidebarGroup icon={<I.Store size={15} />} label="Clientes" badge="127" route={pathname} navigate={navigate} items={[
            { r: '/admin/stores', l: 'Todas as redes' },
            { r: '/admin/stores/new', l: 'Nova rede' },
            { r: '/admin/stores/detail', l: 'Detalhe da rede' },
            { r: '/admin/stores/edit', l: 'Editar rede' },
          ]} />
          <SidebarGroup icon={<I.Layers size={15} />} label="Planos" badge="3" route={pathname} navigate={navigate} items={[
            { r: '/admin/plans', l: 'Todos os planos' },
            { r: '/admin/economics', l: 'Economia dos planos' },
            { r: '/admin/plans/new', l: 'Novo plano' },
            { r: '/admin/plans/edit', l: 'Editar plano' },
          ]} />
          <SidebarItem icon={<I.Credit size={15} />} label="Assinaturas" active={is('/admin/subscriptions')} onClick={() => navigate('/admin/subscriptions')} />
        </SidebarSection>

        <SidebarSection label="Plataforma">
          <SidebarItem icon={<I.Users size={15} />} label="Usuários" active={is('/admin/users')} onClick={() => navigate('/admin/users')} />
          <SidebarItem icon={<I.Chart size={15} />} label="Relatórios" active={is('/admin/reports')} onClick={() => navigate('/admin/reports')} />
          <SidebarItem icon={<I.Cpu size={15} />} label="Monitor de IA" active={is('/admin/ai-monitoring')} onClick={() => navigate('/admin/ai-monitoring')} badge="live" />
          <SidebarItem icon={<I.Settings size={15} />} label="Configurações" active={is('/admin/settings')} onClick={() => navigate('/admin/settings')} />
        </SidebarSection>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--fg)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
          }}>{MOCK.admin.user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{MOCK.admin.user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-soft)' }} className="truncate">{MOCK.admin.user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// === Top Header ===
