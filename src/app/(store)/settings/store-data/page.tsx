import { SettingsStoreData } from '@/features/settings/settings-store-data';
import { loadCompanyData } from '@/features/settings/queries';

export default async function Page() {
  const company = await loadCompanyData();
  return <SettingsStoreData company={company} />;
}
