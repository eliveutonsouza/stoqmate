import { CancelSubscription } from '@/features/billing/cancel-subscription';
import { loadSubscriptionOverview } from '@/features/billing/queries';

export default async function Page() {
  const overview = await loadSubscriptionOverview();
  return <CancelSubscription overview={overview} />;
}
