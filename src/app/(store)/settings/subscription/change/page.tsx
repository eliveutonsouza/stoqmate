import { PlanChange } from '@/features/billing/plan-change';
import { loadSubscriptionOverview } from '@/features/billing/queries';

export default async function Page() {
  const overview = await loadSubscriptionOverview();
  return <PlanChange overview={overview} />;
}
