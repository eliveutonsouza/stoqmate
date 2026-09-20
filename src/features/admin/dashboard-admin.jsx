"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { PLATFORM } from '@/lib/plans';
import { I } from '@/components/icons';
import { MetricsRow } from '@/components/domain/metrics-row';
import { MOCK } from '@/lib/mock';
import { MRRGrowthCard } from '@/features/admin/mrr-growth-card';
import { PlanDistributionCard } from '@/features/admin/plan-distribution-card';
import { RecentSignupsCard } from '@/features/admin/recent-signups-card';
import { SystemHealthCard } from '@/features/admin/system-health-card';

export function DashboardAdmin() {
  const navigate = useNavigate();
  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader
          breadcrumb={['Console', 'Overview']}
          navigate={navigate}
          contextSwitch="admin"
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
              <span className="pulse"></span>
              <span>14h42 · 247 sessões ativas</span>
            </div>
          )}
        />
        <div style={layoutStyles.content}>
          <PageHeader
            title="Console"
            sub={`Saúde da plataforma · ${PLATFORM.nets} redes · ${PLATFORM.units} lojas · 1.842 usuários`}
            actions={(
              <>
                <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
                <button className="btn btn-outline btn-sm"><I.Filter size={13} /> Maio 2026 <I.ChevronDown size={12} /></button>
                <button onClick={() => navigate('/admin/stores/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova rede</button>
              </>
            )}
          />

          <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MetricsRow metrics={MOCK.adminMetrics} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
              <MRRGrowthCard />
              <PlanDistributionCard />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <RecentSignupsCard navigate={navigate} />
              <SystemHealthCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
