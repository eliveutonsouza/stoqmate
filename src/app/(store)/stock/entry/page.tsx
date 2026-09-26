import { StockEntry } from '@/features/stock/stock-entry';
import { loadMovementProduct, loadStockEntryScreen } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; supplier?: string }> }) {
  const { product, supplier } = await searchParams;
  const [{ stores, suppliers, locations }, initialProduct] = await Promise.all([loadStockEntryScreen(), loadMovementProduct(product)]);
  // ?supplier= vem de "Nova entrada" na ficha do fornecedor.
  const initialSupplierId = suppliers.some((s) => s.id === supplier) ? supplier ?? '' : '';
  return <StockEntry stores={stores} suppliers={suppliers} locations={locations} initialProduct={initialProduct} initialSupplierId={initialSupplierId} />;
}
