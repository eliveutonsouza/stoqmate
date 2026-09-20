"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MetricsRow } from '@/components/domain/metrics-row';
import { MOCK } from '@/lib/mock';
import { SalesChartCard } from '@/features/dashboard/sales-chart-card';
import { QuickActionsCard } from '@/features/dashboard/quick-actions-card';
import { CategoryMixCard } from '@/features/dashboard/category-mix-card';
import { StoreBalanceCard } from '@/features/dashboard/store-balance-card';
import { TopProductsCard } from '@/features/dashboard/top-products-card';
import { LowStockCard } from '@/features/dashboard/low-stock-card';
import { RecentMovementsCard } from '@/features/dashboard/recent-movements-card';

export function DashboardStore() {
  const navigate = useNavigate();
  return (
    <StoreShell
      route="/dashboard" breadcrumb={['Loja Centro', 'Dashboard']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span>
          <span>Sincronizado · 14h42</span>
        </div>
      )}
    >
      <PageHeader
        title="Visão geral"
        sub="Sexta, 18 de setembro de 2026 · 1.688 SKUs em 6 categorias"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button className="btn btn-outline btn-sm"><I.Filter size={13} /> Últimos 30 dias <I.ChevronDown size={12} /></button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
          </>
        )}
      />

      <Page gap={20}>
        <MetricsRow metrics={MOCK.metrics} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          <SalesChartCard />
          <QuickActionsCard navigate={navigate} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <CategoryMixCard navigate={navigate} />
          <StoreBalanceCard navigate={navigate} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <TopProductsCard navigate={navigate} />
          <LowStockCard navigate={navigate} />
        </div>

        <RecentMovementsCard navigate={navigate} />
      </Page>
    </StoreShell>
  );
}
