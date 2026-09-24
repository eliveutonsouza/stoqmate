import { LimitReached } from '@/features/credits/limit-reached';
import { loadPlanUsage } from '@/features/credits/queries';

const KINDS = ['skus', 'users', 'stores'];

export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const data = await loadPlanUsage();
  return <LimitReached kind={KINDS.includes(kind ?? '') ? kind : 'skus'} {...data} />;
}
