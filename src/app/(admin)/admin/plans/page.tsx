import { AdminPlans } from '@/features/admin/admin-plans';
import { loadPlans } from '@/features/admin/queries';

export default async function Page() {
  const plans = await loadPlans();
  return <AdminPlans plans={plans} />;
}
