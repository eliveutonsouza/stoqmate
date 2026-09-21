"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';
import { MRRGrowthCard } from '@/features/admin/mrr-growth-card';
import { PlanDistributionCard } from '@/features/admin/plan-distribution-card';
import { RecentSignupsCard } from '@/features/admin/recent-signups-card';
import { SystemHealthCard } from '@/features/admin/system-health-card';

export function DashboardAdmin({ overview }) {
  const navigate = useNavigate();
  const { currentMrr, mrrTrend, planDistribution, tenantCount, recentSignups } = overview;

  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={['Console', 'Overview']} navigate={navigate} contextSwitch="admin" />
        <div style={layoutStyles.content}>
          <PageHeader
            title="Console"
            sub={`Saúde da plataforma · ${tenantCount} rede(s)`}
            actions={<button onClick={() => navigate('/admin/stores/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova rede</button>}
          />

          <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'MRR atual', v: brl(currentMrr) },
                { l: 'ARR projetado', v: brl(currentMrr * 12), s: 'MRR atual × 12' },
                { l: 'Redes na plataforma', v: `${tenantCount}` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 4 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
              <MRRGrowthCard mrrTrend={mrrTrend} currentMrr={currentMrr} />
              <PlanDistributionCard planDistribution={planDistribution} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <RecentSignupsCard navigate={navigate} signups={recentSignups} />
              <SystemHealthCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
