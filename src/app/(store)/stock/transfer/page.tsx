import { StockTransfer } from '@/features/stock/stock-transfer';
import { loadStores } from '@/features/stock/queries';
import { loadMovementProduct, loadPendingTransferCount } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; from?: string; to?: string; qty?: string }> }) {
  const { product, from, to, qty } = await searchParams;
  const [stores, initialProduct, pendingCount] = await Promise.all([loadStores(), loadMovementProduct(product), loadPendingTransferCount()]);
  // ?from=&to=&qty= vêm do "Transferir" do estoque desbalanceado (Visão da rede).
  const known = (id?: string) => (stores.some((st) => st.id === id) ? id ?? '' : '');
  const initialQty = Math.max(1, Math.min(9999, Math.floor(Number(qty)) || 1));
  return <StockTransfer stores={stores} initialProduct={initialProduct} pendingCount={pendingCount} initialOriginId={known(from)} initialDestId={known(to)} initialQty={initialQty} />;
}
