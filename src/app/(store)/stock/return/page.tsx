import { StockReturn } from '@/features/stock/stock-return';
import { loadMovementProduct, loadStockSaleScreen } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; store?: string; qty?: string }> }) {
  const { product, store, qty } = await searchParams;
  // Caixas abertos: devolver em dinheiro sai do caixa da loja.
  const [{ stores, cashSessionByStore, canRefund }, initialProduct] = await Promise.all([loadStockSaleScreen(), loadMovementProduct(product)]);
  const initialQty = Math.max(1, Math.min(9999, Math.floor(Number(qty)) || 1));
  const initialStoreId = stores.some((s) => s.id === store) ? store : null;
  return <StockReturn stores={stores} cashSessionByStore={cashSessionByStore} canRefund={canRefund} initialProduct={initialProduct} initialStoreId={initialStoreId} initialQty={initialQty} />;
}
