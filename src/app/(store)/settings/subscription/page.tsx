import { SettingsSubscription } from '@/features/settings/settings-subscription';
import { loadBillingState } from '@/features/billing/queries';

export default async function Page() {
  const billing = await loadBillingState();
  return <SettingsSubscription billing={billing} />;
}
