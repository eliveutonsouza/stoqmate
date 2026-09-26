import { StockSale } from '@/features/stock/stock-sale';
import { loadMovementProduct, loadStockSaleScreen } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const [{ stores, cashSessionByStore }, initialProduct] = await Promise.all([loadStockSaleScreen(), loadMovementProduct(product)]);
  return <StockSale stores={stores} cashSessionByStore={cashSessionByStore} initialProduct={initialProduct} />;
}
