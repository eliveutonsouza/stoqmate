import { MovementDetail } from '@/features/stock/movement-detail';
import { loadMovementDetail } from '@/features/stock/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const movement = id ? await loadMovementDetail(id) : null;
  return <MovementDetail movement={movement} />;
}
