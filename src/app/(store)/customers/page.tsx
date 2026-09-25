import { Customers } from '@/features/customers/customers';
import { loadCustomers } from '@/features/customers/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadCustomers(await searchParams);
  return <Customers {...data} />;
}
