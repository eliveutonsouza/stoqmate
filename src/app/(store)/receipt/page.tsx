import { Receipt } from '@/features/pos/receipt';
import { loadSaleReceipt } from '@/features/pos/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const sale = id ? await loadSaleReceipt(id) : null;
  return <Receipt sale={sale} />;
}
