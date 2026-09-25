import { AdminSubscriptions } from '@/features/admin/admin-subscriptions';
import { loadSubscriptionsOverview } from '@/features/admin/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const overview = await loadSubscriptionsOverview(await searchParams);
  return <AdminSubscriptions overview={overview} />;
}
