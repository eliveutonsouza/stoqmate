"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { layoutStyles } from '@/components/layout/layout-styles';
import { I } from '@/components/icons';
import { SidebarSection } from '@/components/layout/sidebar-section';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { SidebarGroup } from '@/components/layout/sidebar-group';
import { RowMenu } from '@/components/ui/row-menu';
import { useShell, countBadge } from '@/components/layout/shell-context';
import { can } from '@/lib/permissions';

export function StoreSidebar({ navigate }) {
  const pathname = usePathname();
  const shell = useShell();
  const [switchError, setSwitchError] = React.useState(null);
  const is = (r) => pathname === r;
  const c = shell?.counts ?? {};
  const roleId = shell?.user?.roleId;
  // Sem sessão (Storybook) mostra tudo; com sessão, só o que o perfil alcança.
  const visible = (r) => !roleId || can(roleId, r);
  const only = (items) => items.filter((it) => visible(it.r));
  const item = (r, props) => visible(r) && <SidebarItem href={r} active={is(r)} onClick={() => navigate(r)} {...props} />;
  const group = (props) => {
    const items = only(props.items);
    return items.length > 0 && <SidebarGroup route={pathname} navigate={navigate} {...props} items={items} />;
  };

  const stores = shell?.stores ?? [];
  const switchStore = (id) => {
    setSwitchError(null);
    shell.actions.setActiveStore(id).then((r) => { if (r?.error) setSwitchError(r.error); });
  };

  return (
    <aside style={layoutStyles.sidebar}>
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <I.Brand size={22} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.015em' }} className="truncate">{shell?.tenant?.name ?? 'Stoqmate'}</div>
          {shell?.activeStore && <div style={{ fontSize: 11, color: 'var(--fg-muted)' }} className="truncate">{shell.activeStore.name}</div>}
        </div>
        <div style={{ flex: 1 }}></div>
        {stores.length > 1 && (
          <RowMenu label="Trocar de unidade" icon={<I.Swap size={14} />}
            items={stores.map((st) => ({
              label: st.id === shell.activeStore?.id ? `✓ ${st.name}` : st.name,
              onSelect: () => switchStore(st.id),
              disabled: st.id === shell.activeStore?.id,
            }))} />
        )}
      </div>
      {switchError && <div role="alert" style={{ margin: '0 14px 8px', fontSize: 11, color: 'var(--danger)' }}>{switchError}</div>}

      <div style={{ padding: '0 12px 10px' }}>
        <button onClick={() => navigate('/search')} className="btn btn-outline btn-sm" style={{
          width: '100%', justifyContent: 'flex-start',
          color: 'var(--fg-muted)', fontWeight: 400,
        }}>
          <I.Search size={13} />
          <span>Buscar produtos, SKUs…</span>
          <span style={{ flex: 1 }}></span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        <SidebarSection>
          {item('/dashboard', { icon: <I.Home size={15} />, label: 'Dashboard' })}
          {item('/network', { icon: <I.Swap size={15} />, label: 'Visão da rede', badge: c.stores > 1 ? countBadge(c.stores) : undefined })}
          {group({ icon: <I.Sparkle size={15} />, label: 'IA', items: [
            { r: '/ai', l: 'Central de IA' },
            { r: '/ai/queue', l: 'Fila de revisão' },
            { r: '/ai/anomalies', l: 'Anomalias' },
            { r: '/ai/forecast', l: 'Previsão de demanda' },
            { r: '/ai/enrich', l: 'Enriquecimento' },
            { r: '/stock/entry/ocr', l: 'OCR de nota fiscal' },
          ] })}
          {group({ icon: <I.Credit size={15} />, label: 'Balcão', items: [
            { r: '/pos', l: 'POS em tablet' },
            { r: '/stock/sale', l: 'Venda no desktop' },
            { r: '/cash', l: 'Fechamento de caixa' },
            { r: '/customers', l: 'Clientes', b: countBadge(c.customers) },
          ] })}
          {group({ icon: <I.Box size={15} />, label: 'Catálogo', badge: countBadge(c.products), items: [
            { r: '/products', l: 'Todos os produtos' },
            { r: '/products/new', l: 'Cadastrar produto' },
            { r: '/products/import', l: 'Importar planilha' },
            { r: '/products/pricing', l: 'Reajuste de preços' },
            { r: '/categories', l: 'Categorias e atributos', b: countBadge(c.categories) },
            { r: '/labels', l: 'Etiquetas' },
          ] })}
          {group({ icon: <I.Activity size={15} />, label: 'Estoque', items: [
            { r: '/stock', l: 'Visão geral' },
            { r: '/stock/entry', l: 'Entrada' },
            { r: '/stock/sale', l: 'Venda (saída)' },
            { r: '/stock/transfer', l: 'Transferência entre lojas' },
            { r: '/stock/exchange', l: 'Troca' },
            { r: '/stock/return', l: 'Devolução' },
            { r: '/stock/adjustment', l: 'Ajuste de inventário' },
            { r: '/stock/count', l: 'Contagem em lote' },
            { r: '/mobile/count', l: 'Conferência no celular' },
            { r: '/stock/history', l: 'Histórico' },
          ] })}
          {group({ icon: <I.Chart size={15} />, label: 'Relatórios', items: [
            { r: '/reports', l: 'Visão geral' },
            { r: '/reports/sales', l: 'Vendas' },
            { r: '/reports/categories', l: 'Categorias e produtos' },
            { r: '/reports/attributes', l: 'Atributos mais vendidos' },
            { r: '/reports/profit', l: 'Lucratividade' },
            { r: '/reports/abc', l: 'Curva ABC' },
            { r: '/exports', l: 'Exportações' },
          ] })}
        </SidebarSection>

        <SidebarSection label="Operação">
          {item('/purchase-orders', { icon: <I.Truck size={15} />, label: 'Compras', badge: countBadge(c.open_orders) })}
          {group({ icon: <I.Layers size={15} />, label: 'Fornecedores', badge: countBadge(c.suppliers), items: [
            { r: '/suppliers', l: 'Todos os fornecedores' },
            { r: '/suppliers/new', l: 'Cadastrar fornecedor' },
          ] })}
          {group({ icon: <I.Tag size={15} />, label: 'Promoções', badge: countBadge(c.active_promos), items: [
            { r: '/promotions', l: 'Todas as promoções' },
            { r: '/promotions/new', l: 'Criar promoção' },
          ] })}
          {group({ icon: <I.Grid size={15} />, label: 'Locais de estoque', items: [
            { r: '/shelves', l: 'Todos os locais' },
            { r: '/shelves/new', l: 'Novo local' },
          ] })}
        </SidebarSection>

        <SidebarSection label="Conta">
          {group({ icon: <I.Settings size={15} />, label: 'Configurações', items: [
            { r: '/settings', l: 'Visão geral' },
            { r: '/settings/branding', l: 'Branding' },
            { r: '/settings/store-data', l: 'Dados da empresa' },
            { r: '/settings/units', l: 'Unidades da rede', b: countBadge(c.stores) },
            { r: '/settings/notifications', l: 'Regras de aviso' },
            { r: '/settings/users', l: 'Usuários' },
            { r: '/settings/subscription', l: 'Plano e assinatura' },
          ] })}
          {item('/profile', { icon: <I.Shield size={15} />, label: 'Meu perfil' })}
          {item('/notifications', { icon: <I.Bell size={15} />, label: 'Notificações', badge: countBadge(c.unread_notifications) })}
          {item('/help', { icon: <I.Sparkle size={15} />, label: 'Ajuda' })}
        </SidebarSection>
      </div>

      {shell?.user && (
        <div style={{ borderTop: '1px solid var(--line)', padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px' }}>
            <div aria-hidden="true" style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent-strong)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
            }}>{shell.user.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{shell.user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-soft)' }} className="truncate">{shell.user.role}</div>
            </div>
            <RowMenu label="Menu da conta" items={[
              { label: 'Meu perfil', onSelect: () => navigate('/profile') },
              { label: 'Ajuda', onSelect: () => navigate('/help') },
              { label: 'Sair', tone: 'danger', onSelect: () => shell.actions.signOut() },
            ]} />
          </div>
        </div>
      )}
    </aside>
  );
}

// === Admin Sidebar ===
