import { CustomerDetail } from '@/features/customers/customer-detail';
import { loadCustomerDetail } from '@/features/customers/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const detail = id ? await loadCustomerDetail(id) : null;
  return <CustomerDetail detail={detail} />;
}
