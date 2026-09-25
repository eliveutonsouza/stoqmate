import { InvoiceDetail } from '@/features/billing/invoice-detail';
import { loadInvoiceDetail } from '@/features/billing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id } = await searchParams;
  const data = await loadInvoiceDetail(typeof id === 'string' ? id : undefined);
  return <InvoiceDetail data={data} />;
}
