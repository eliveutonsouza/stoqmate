import { AdminStoreDetail } from '@/features/admin/admin-store-detail';
import { loadSubscriptionDetail, loadTenantDetail } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [detail, subscription] = id ? await Promise.all([loadTenantDetail(id), loadSubscriptionDetail(id)]) : [null, null];
  return <AdminStoreDetail detail={detail} subscription={subscription} />;
}
