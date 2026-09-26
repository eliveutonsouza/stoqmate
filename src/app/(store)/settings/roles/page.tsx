import { Roles } from '@/features/tools/roles';
import { loadRoleCounts } from '@/features/tools/queries';

export default async function Page() {
  return <Roles counts={await loadRoleCounts()} />;
}
