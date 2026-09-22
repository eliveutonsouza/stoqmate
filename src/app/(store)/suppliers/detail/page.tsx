import { SupplierDetail } from '@/features/entities/supplier-detail';
import { loadSupplierDetail } from '@/features/operations/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const supplier = id ? await loadSupplierDetail(id) : null;
  return <SupplierDetail supplier={supplier} />;
}
