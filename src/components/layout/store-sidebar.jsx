"use client";

import { usePathname } from 'next/navigation';
import { layoutStyles } from '@/components/layout/layout-styles';
import { I } from '@/components/icons';
import { MOCK } from '@/lib/mock';
import { SidebarSection } from '@/components/layout/sidebar-section';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { SidebarGroup } from '@/components/layout/sidebar-group';

export function StoreSidebar({ navigate }) {
  const pathname = usePathname();
  const is = (r) => pathname === r;
  return (
    <aside style={layoutStyles.sidebar}>
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <I.Brand size={22} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.015em' }} className="truncate">{MOCK.store.name}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }} className="truncate">{MOCK.store.unit}</div>
        </div>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-ghost btn-icon btn-sm" title="Trocar de unidade"><I.Swap size={14} /></button>
      </div>

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
          <SidebarItem icon={<I.Home size={15} />} label="Dashboard" active={is('/dashboard')} onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<I.Swap size={15} />} label="Visão da rede" active={is('/network')} onClick={() => navigate('/network')} badge="4" />
          <SidebarGroup icon={<I.Sparkle size={15} />} label="IA" badge="12" route={pathname} navigate={navigate} items={[
            { r: '/ai', l: 'Central de IA' },
            { r: '/ai/queue', l: 'Fila de revisão', b: '12' },
            { r: '/ai/anomalies', l: 'Anomalias', b: '5' },
            { r: '/ai/forecast', l: 'Previsão de demanda' },
            { r: '/ai/enrich', l: 'Enriquecimento' },
            { r: '/stock/entry/ocr', l: 'OCR de nota fiscal' },
          ]} />
          <SidebarGroup icon={<I.Credit size={15} />} label="Balcão" route={pathname} navigate={navigate} items={[
            { r: '/pos', l: 'POS em tablet' },
            { r: '/stock/sale', l: 'Venda no desktop' },
            { r: '/cash', l: 'Fechamento de caixa' },
            { r: '/customers', l: 'Clientes', b: '482' },
          ]} />
          <SidebarGroup icon={<I.Box size={15} />} label="Catálogo" badge="1.688" route={pathname} navigate={navigate} items={[
            { r: '/products', l: 'Todos os produtos' },
            { r: '/products/new', l: 'Cadastrar produto' },
            { r: '/products/edit', l: 'Editar produto' },
            { r: '/products/detail', l: 'Detalhe do produto' },
            { r: '/products/import', l: 'Importar planilha' },
            { r: '/products/pricing', l: 'Reajuste de preços' },
            { r: '/categories', l: 'Categorias e atributos', b: '6' },
            { r: '/labels', l: 'Etiquetas' },
          ]} />
          <SidebarGroup icon={<I.Activity size={15} />} label="Estoque" route={pathname} navigate={navigate} items={[
            { r: '/stock', l: 'Visão geral' },
            { r: '/stock/entry', l: 'Entrada' },
            { r: '/stock/sale', l: 'Venda (saída)' },
            { r: '/stock/transfer', l: 'Transferência entre lojas' },
            { r: '/stock/exchange', l: 'Troca' },
            { r: '/stock/return', l: 'Devolução' },
            { r: '/stock/adjustment', l: 'Ajuste de inventário' },
            { r: '/stock/count', l: 'Contagem em lote' },
            { r: '/mobile/count', l: 'Conferência no celular' },
            { r: '/stock/history', l: 'Histórico', b: '1.142' },
          ]} />
          <SidebarGroup icon={<I.Chart size={15} />} label="Relatórios" route={pathname} navigate={navigate} items={[
            { r: '/reports', l: 'Visão geral' },
            { r: '/reports/sales', l: 'Vendas' },
            { r: '/reports/categories', l: 'Categorias e produtos' },
            { r: '/reports/attributes', l: 'Atributos mais vendidos' },
            { r: '/reports/profit', l: 'Lucratividade' },
            { r: '/reports/abc', l: 'Curva ABC' },
            { r: '/exports', l: 'Exportações' },
          ]} />
        </SidebarSection>

        <SidebarSection label="Operação">
          <SidebarItem icon={<I.Truck size={15} />} label="Compras" active={is('/purchase-orders')} onClick={() => navigate('/purchase-orders')} badge="7" />
          <SidebarGroup icon={<I.Layers size={15} />} label="Fornecedores" badge="6" route={pathname} navigate={navigate} items={[
            { r: '/suppliers', l: 'Todos os fornecedores' },
            { r: '/suppliers/new', l: 'Cadastrar fornecedor' },
            { r: '/suppliers/detail', l: 'Detalhe do fornecedor' },
          ]} />
          <SidebarGroup icon={<I.Tag size={15} />} label="Promoções" badge="3" route={pathname} navigate={navigate} items={[
            { r: '/promotions', l: 'Todas as promoções' },
            { r: '/promotions/new', l: 'Criar promoção' },
          ]} />
          <SidebarGroup icon={<I.Grid size={15} />} label="Locais de estoque" route={pathname} navigate={navigate} items={[
            { r: '/shelves', l: 'Todos os locais' },
            { r: '/shelves/new', l: 'Novo local' },
          ]} />
        </SidebarSection>

        <SidebarSection label="Conta">
          <SidebarGroup icon={<I.Settings size={15} />} label="Configurações" route={pathname} navigate={navigate} items={[
            { r: '/settings', l: 'Visão geral' },
            { r: '/settings/branding', l: 'Branding' },
            { r: '/settings/store-data', l: 'Dados da empresa' },
            { r: '/settings/units', l: 'Unidades da rede', b: '4' },
            { r: '/settings/notifications', l: 'Regras de aviso' },
            { r: '/settings/users', l: 'Usuários' },
            { r: '/settings/subscription', l: 'Plano e assinatura' },
          ]} />
          <SidebarItem icon={<I.Shield size={15} />} label="Meu perfil" active={is('/profile')} onClick={() => navigate('/profile')} />
          <SidebarItem icon={<I.Bell size={15} />} label="Notificações" active={is('/notifications')} onClick={() => navigate('/notifications')} badge="3" />
          <SidebarItem icon={<I.Sparkle size={15} />} label="Ajuda" active={is('/help')} onClick={() => navigate('/help')} />
        </SidebarSection>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent-strong)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
          }}>{MOCK.store.user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{MOCK.store.user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-soft)' }} className="truncate">{MOCK.store.user.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" title="Mais"><I.More size={14} /></button>
        </div>
      </div>
    </aside>
  );
}

// === Admin Sidebar ===
