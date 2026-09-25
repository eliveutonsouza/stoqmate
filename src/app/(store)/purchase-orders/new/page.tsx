import { PurchaseOrderNew } from '@/features/purchasing/purchase-order-new';
import { loadPurchaseOrderNew } from '@/features/purchasing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string; supplier?: string; prefill?: string }> }) {
  const params = await searchParams;
  const data = await loadPurchaseOrderNew(params);
  return (
    <PurchaseOrderNew
      key={`${data.storeId}:${data.supplierId}:${params.prefill ?? ''}`}
      stores={data.stores}
      storeId={data.storeId}
      suppliers={data.suppliers}
      supplierId={data.supplierId}
      suggestions={data.suggestions}
      qtyOverrides={data.qtyOverrides}
    />
  );
}
