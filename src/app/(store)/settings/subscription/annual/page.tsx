import { SwitchToAnnual } from '@/features/billing/switch-to-annual';
import { loadSubscriptionOverview } from '@/features/billing/queries';

export default async function Page() {
  const overview = await loadSubscriptionOverview();
  return <SwitchToAnnual overview={overview} />;
}
