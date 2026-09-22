import { SettingsUsers } from '@/features/settings/settings-users';
import { loadTeam } from '@/features/settings/queries';

export default async function Page() {
  const team = await loadTeam();
  return <SettingsUsers {...team} />;
}
