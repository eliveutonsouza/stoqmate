import { AccessDenied } from '@/features/system/access-denied';
import { loadCurrentRole } from '@/features/system/queries';

export default async function Page() {
  const role = await loadCurrentRole();
  return <AccessDenied role={role} />;
}
