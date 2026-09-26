import { StockEntry } from '@/features/stock/stock-entry';
import { loadMovementProduct, loadStockEntryScreen } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const [{ stores, suppliers, locations }, initialProduct] = await Promise.all([loadStockEntryScreen(), loadMovementProduct(product)]);
  return <StockEntry stores={stores} suppliers={suppliers} locations={locations} initialProduct={initialProduct} />;
}
