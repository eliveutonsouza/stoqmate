import { InvoiceMatch } from '@/features/ai-flows/invoice-match';
import { loadPurchaseOrder, loadOpenPurchaseOrders } from '@/features/purchasing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (id) {
    const order = await loadPurchaseOrder(id);
    return <InvoiceMatch order={order && order.status === 'sent' ? order : null} />;
  }
  const orders = await loadOpenPurchaseOrders();
  return <InvoiceMatch order={null} openOrders={orders.filter((o) => o.status === 'sent')} />;
}
