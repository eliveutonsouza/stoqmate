import { Profile } from '@/features/settings/profile';
import { loadProfile } from '@/features/settings/queries';

export default async function Page() {
  const profile = await loadProfile();
  return <Profile profile={profile} />;
}
