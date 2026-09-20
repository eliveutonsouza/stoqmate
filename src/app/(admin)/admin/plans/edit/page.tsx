import { AdminPlanForm } from '@/features/admin/admin-plan-form';
import { loadPlan } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const plan = id ? await loadPlan(id) : null;
  return <AdminPlanForm mode="edit" plan={plan} />;
}
