import { AdminStoreForm } from '@/features/admin/admin-store-form';
import { loadPlans, loadTenantDetail } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [plans, detail] = await Promise.all([loadPlans(), id ? loadTenantDetail(id) : Promise.resolve(null)]);
  return <AdminStoreForm mode="edit" plans={plans} detail={detail} />;
}
