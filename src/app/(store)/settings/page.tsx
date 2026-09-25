import { SettingsHub } from '@/features/settings/settings-hub';
import { loadSettingsHub } from '@/features/settings/queries';

export default async function Page() {
  const hub = await loadSettingsHub();
  return <SettingsHub hub={hub} />;
}
