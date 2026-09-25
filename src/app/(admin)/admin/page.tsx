import { DashboardAdmin } from '@/features/admin/dashboard-admin';
import { loadAdminOverview } from '@/features/admin/queries';
import { loadSystemHealth } from '@/features/admin/health-queries';

export default async function Page() {
  const [overview, health] = await Promise.all([loadAdminOverview(), loadSystemHealth()]);
  return <DashboardAdmin overview={overview} health={health} />;
}
