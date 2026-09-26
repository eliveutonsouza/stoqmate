import { StockReturn } from '@/features/stock/stock-return';
import { loadStores } from '@/features/stock/queries';
import { loadMovementProduct } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; store?: string; qty?: string }> }) {
  const { product, store, qty } = await searchParams;
  const [stores, initialProduct] = await Promise.all([loadStores(), loadMovementProduct(product)]);
  const initialQty = Math.max(1, Math.min(9999, Math.floor(Number(qty)) || 1));
  const initialStoreId = stores.some((s) => s.id === store) ? store : null;
  return <StockReturn stores={stores} initialProduct={initialProduct} initialStoreId={initialStoreId} initialQty={initialQty} />;
}
