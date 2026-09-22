import { FirstRun } from '@/features/customers/first-run';
import { loadFirstRunStatus } from '@/features/customers/queries';

export default async function Page() {
  const status = await loadFirstRunStatus();
  return <FirstRun status={status} />;
}
