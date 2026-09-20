import { AdminStoreDetail } from '@/features/admin/admin-store-detail';
import { loadTenantDetail } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const detail = id ? await loadTenantDetail(id) : null;
  return <AdminStoreDetail detail={detail} />;
}
