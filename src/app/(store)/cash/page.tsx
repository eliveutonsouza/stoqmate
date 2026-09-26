import { CashSession } from '@/features/pos/cash-session';
import { loadCashScreen } from '@/features/pos/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams;
  return <CashSession {...await loadCashScreen(store)} />;
}
