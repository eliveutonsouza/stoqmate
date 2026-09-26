import { StockTransfer } from '@/features/stock/stock-transfer';
import { loadStores } from '@/features/stock/queries';
import { loadMovementProduct, loadPendingTransferCount } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const [stores, initialProduct, pendingCount] = await Promise.all([loadStores(), loadMovementProduct(product), loadPendingTransferCount()]);
  return <StockTransfer stores={stores} initialProduct={initialProduct} pendingCount={pendingCount} />;
}
