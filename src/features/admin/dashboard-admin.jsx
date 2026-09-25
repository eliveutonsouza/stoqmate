"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';
import { MRRGrowthCard } from '@/features/admin/mrr-growth-card';
import { PlanDistributionCard } from '@/features/admin/plan-distribution-card';
import { RecentSignupsCard } from '@/features/admin/recent-signups-card';
import { SystemHealthCard } from '@/features/admin/system-health-card';

export function DashboardAdmin({ overview, health }) {
  const navigate = useNavigate();
  const { currentMrr, mrrTrend, planDistribution, tenantCount, recentSignups } = overview;

  return (
    <AdminShell breadcrumb={['Overview']} navigate={navigate}>
          <PageHeader
            title="Console"
            sub={`Saúde da plataforma · ${tenantCount} rede(s)`}
            actions={<button onClick={() => navigate('/admin/stores/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova rede</button>}
          />

          <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="g3 kpi-strip">
              {[
                { l: 'MRR atual', v: brl(currentMrr) },
                { l: 'ARR projetado', v: brl(currentMrr * 12), s: 'MRR atual × 12' },
                { l: 'Redes na plataforma', v: `${tenantCount}` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 4 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <div className="split-2" style={{ '--a': '1.4fr' }}>
              <MRRGrowthCard mrrTrend={mrrTrend} currentMrr={currentMrr} />
              <PlanDistributionCard planDistribution={planDistribution} />
            </div>

            <div className="split-2" style={{ '--a': '1.2fr' }}>
              <RecentSignupsCard navigate={navigate} signups={recentSignups} />
              <SystemHealthCard health={health} />
            </div>
          </div>
    </AdminShell>
  );
}
