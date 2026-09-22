import { SettingsBranding } from '@/features/settings/settings-branding';
import { loadBranding } from '@/features/settings/queries';

export default async function Page() {
  const branding = await loadBranding();
  return <SettingsBranding branding={branding} />;
}
