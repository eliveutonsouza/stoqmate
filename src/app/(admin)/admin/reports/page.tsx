import { AdminReports } from '@/features/admin/admin-reports';
import { loadPlatformReports } from '@/features/admin/queries';

export default async function Page() {
  const reports = await loadPlatformReports();
  return <AdminReports reports={reports} />;
}
