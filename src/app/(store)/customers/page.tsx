import { Customers } from '@/features/customers/customers';
import { loadCustomers } from '@/features/customers/queries';

export default async function Page() {
  const customers = await loadCustomers();
  return <Customers customers={customers} />;
}
