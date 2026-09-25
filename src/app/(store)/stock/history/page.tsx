import { StockHistory } from '@/features/stock/stock-history';
import { loadStockHistory } from '@/features/stock/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadStockHistory(await searchParams);
  return <StockHistory {...data} />;
}
