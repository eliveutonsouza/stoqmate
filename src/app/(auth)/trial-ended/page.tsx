import { TrialEnded } from '@/features/billing/trial-ended';
import { loadTrialEndedState } from '@/features/billing/queries';

export default async function Page() {
  const state = await loadTrialEndedState();
  return <TrialEnded state={state} />;
}
