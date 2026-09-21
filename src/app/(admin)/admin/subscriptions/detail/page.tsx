import { AdminSubscriptionDetail } from '@/features/public/admin-subscription-detail';
import { loadSubscriptionDetail } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const detail = id ? await loadSubscriptionDetail(id) : null;
  return <AdminSubscriptionDetail detail={detail} />;
}
