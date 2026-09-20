import { AuditLog } from '@/features/tools/audit-log';
import { loadAuditLog } from '@/features/tools/queries';

export default async function Page() {
  const entries = await loadAuditLog();
  return <AuditLog entries={entries} />;
}
