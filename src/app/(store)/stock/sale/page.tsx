import { StockSale } from '@/features/stock/stock-sale';
import { loadMovementProduct, loadSaleCustomer, loadStockSaleScreen } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; customer?: string }> }) {
  const { product, customer } = await searchParams;
  const [{ stores, cashSessionByStore }, initialProduct, initialCustomer] = await Promise.all([
    loadStockSaleScreen(), loadMovementProduct(product), loadSaleCustomer(customer),
  ]);
  return <StockSale stores={stores} cashSessionByStore={cashSessionByStore} initialProduct={initialProduct} initialCustomer={initialCustomer} />;
}
