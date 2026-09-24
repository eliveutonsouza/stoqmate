"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MetricsRow } from '@/components/domain/metrics-row';
import { brl } from '@/lib/format';
import { SalesChartCard } from '@/features/dashboard/sales-chart-card';
import { QuickActionsCard } from '@/features/dashboard/quick-actions-card';
import { CategoryMixCard } from '@/features/dashboard/category-mix-card';
import { StoreBalanceCard } from '@/features/dashboard/store-balance-card';
import { TopProductsCard } from '@/features/dashboard/top-products-card';
import { LowStockCard } from '@/features/dashboard/low-stock-card';
import { RecentMovementsCard } from '@/features/dashboard/recent-movements-card';

const pct = (n) => (n === null || n === undefined ? null : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`);

export function DashboardStore({
  storeName, storeCount, date, metrics, salesSeries, byCategory, topProducts,
  lowStockCount, lowStockItems, storeBalances, movements,
}) {
  const navigate = useNavigate();

  const metricsRow = [
    {
      label: 'Receita (30 dias)', value: brl(metrics.revenue),
      delta: pct(metrics.revenueDelta), trend: metrics.revenueDelta > 0 ? 'up' : metrics.revenueDelta < 0 ? 'down' : null,
      sub: `${metrics.saleCount} venda${metrics.saleCount === 1 ? '' : 's'} registrada${metrics.saleCount === 1 ? '' : 's'}`,
      spark: metrics.revenueSpark,
    },
    {
      label: 'Unidades vendidas', value: metrics.units.toLocaleString('pt-BR'),
      delta: pct(metrics.unitsDelta), trend: metrics.unitsDelta > 0 ? 'up' : metrics.unitsDelta < 0 ? 'down' : null,
      sub: 'Últimos 30 dias',
    },
    {
      label: 'Itens em estoque', value: metrics.totalQty.toLocaleString('pt-BR'),
      sub: `${metrics.skuCount} SKUs em ${metrics.categoriesActive} categorias`,
    },
    {
      label: 'Giro de estoque', value: metrics.turnover !== null ? `${metrics.turnover.toFixed(1)}×` : '—',
      sub: 'Custo vendido ÷ valor em estoque, 30 dias',
    },
  ];

  return (
    <StoreShell
      route="/dashboard" breadcrumb={[storeName, 'Dashboard']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span>
          <span>Sincronizado</span>
        </div>
      )}
    >
      <PageHeader
        title="Visão geral"
        sub={`${date} · ${metrics.skuCount} SKUs em ${metrics.categoriesActive} categorias${storeCount > 1 ? ` · ${storeCount} unidades` : ''}`}
        actions={(
          <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
        )}
      />

      <Page gap={20}>
        <MetricsRow metrics={metricsRow} />

        <div className="split-2" style={{ '--a': '1.6fr', '--b': '1fr', alignItems: 'stretch' }}>
          <SalesChartCard salesSeries={salesSeries} revenue={metrics.revenue} delta={metrics.revenueDelta} />
          <QuickActionsCard navigate={navigate} />
        </div>

        <div className="g2">
          <CategoryMixCard navigate={navigate} byCategory={byCategory} />
          <StoreBalanceCard navigate={navigate} storeBalances={storeBalances} />
        </div>

        <div className="split-2" style={{ '--a': '1.4fr', '--b': '1fr', alignItems: 'stretch' }}>
          <TopProductsCard navigate={navigate} topProducts={topProducts} />
          <LowStockCard navigate={navigate} items={lowStockItems} count={lowStockCount} />
        </div>

        <RecentMovementsCard navigate={navigate} movements={movements} />
      </Page>
    </StoreShell>
  );
}
