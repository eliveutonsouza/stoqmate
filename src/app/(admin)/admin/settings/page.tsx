import { AdminSettings } from '@/features/admin/admin-settings';
import { loadPlatformSettings } from '@/features/admin/queries';

export default async function Page() {
  const data = await loadPlatformSettings();
  return <AdminSettings {...data} />;
}
