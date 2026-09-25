import { PastDue } from '@/features/billing/past-due';
import { loadPastDueState } from '@/features/billing/queries';

export default async function Page() {
  const state = await loadPastDueState();
  return <PastDue state={state} />;
}
