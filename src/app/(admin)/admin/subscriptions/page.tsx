import { AdminSubscriptions } from '@/features/admin/admin-subscriptions';
import { loadSubscriptionsOverview } from '@/features/admin/queries';

export default async function Page() {
  const overview = await loadSubscriptionsOverview();
  return <AdminSubscriptions overview={overview} />;
}
