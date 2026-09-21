import { AdminStoreForm } from '@/features/admin/admin-store-form';
import { loadPlans } from '@/features/admin/queries';

export default async function Page() {
  const plans = await loadPlans();
  return <AdminStoreForm plans={plans} />;
}
