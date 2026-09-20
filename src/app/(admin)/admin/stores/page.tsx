import { AdminStores } from '@/features/admin/admin-stores';
import { loadTenantsOverview } from '@/features/admin/queries';

export default async function Page() {
  const tenants = await loadTenantsOverview();
  return <AdminStores tenants={tenants} />;
}
