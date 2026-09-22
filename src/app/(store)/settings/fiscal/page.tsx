import { SettingsFiscal } from '@/features/settings/settings-fiscal';
import { loadFiscalMode } from '@/features/settings/queries';

export default async function Page() {
  const fiscalMode = await loadFiscalMode();
  return <SettingsFiscal fiscalMode={fiscalMode} />;
}
