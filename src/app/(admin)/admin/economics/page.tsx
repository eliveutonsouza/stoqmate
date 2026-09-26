import { AdminEconomics } from '@/features/admin/admin-economics';
import { loadEconomicsPlans } from '@/features/admin/queries';

export default async function Page() {
  const plans = await loadEconomicsPlans();
  return <AdminEconomics plans={plans} />;
}
