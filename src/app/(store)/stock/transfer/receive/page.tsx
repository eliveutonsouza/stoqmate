import { TransferReceive } from '@/features/stock/transfer-receive';
import { loadTransferToReceive } from '@/features/stock/screen-queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const { transfer, pendingCount } = await loadTransferToReceive(id);
  return <TransferReceive transfer={transfer} pendingCount={pendingCount} />;
}
