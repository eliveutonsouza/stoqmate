import { Checkout } from '@/features/public/checkout';
import { loadCheckoutState } from '@/features/billing/queries';

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string | string[]; cycle?: string | string[] }> }) {
  const { plan, cycle } = await searchParams;
  const state = await loadCheckoutState({
    plan: typeof plan === 'string' ? plan : undefined,
    cycle: typeof cycle === 'string' ? cycle : undefined,
  });
  return <Checkout state={state} />;
}
