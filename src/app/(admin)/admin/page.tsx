import { DashboardAdmin } from '@/features/admin/dashboard-admin';
import { loadAdminOverview } from '@/features/admin/queries';

export default async function Page() {
  const overview = await loadAdminOverview();
  return <DashboardAdmin overview={overview} />;
}
