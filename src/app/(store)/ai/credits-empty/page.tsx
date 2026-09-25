import { CreditsEmpty } from '@/features/credits/credits-empty';
import { loadCreditsEmptyState } from '@/features/credits/credits-empty-queries';

export default async function Page() {
  const state = await loadCreditsEmptyState();
  return <CreditsEmpty state={state} />;
}
