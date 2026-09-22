import { DashboardStore } from '@/features/dashboard/dashboard-store';
import { loadDashboardData } from '@/features/dashboard/queries';

export default async function Page() {
  const data = await loadDashboardData();
  return <DashboardStore {...data} />;
}
