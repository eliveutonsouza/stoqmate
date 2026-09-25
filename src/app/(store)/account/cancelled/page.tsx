import { AccountCancelled } from '@/features/billing/account-cancelled';
import { loadAccountCancelledState } from '@/features/billing/queries';

export default async function Page() {
  const state = await loadAccountCancelledState();
  return <AccountCancelled state={state} />;
}
