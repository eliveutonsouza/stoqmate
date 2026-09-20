import { AdminUsers } from '@/features/admin/admin-users';
import { loadPlatformStaff, loadPlatformAuditLog } from '@/features/admin/queries';

export default async function Page() {
  const [staff, auditLog] = await Promise.all([loadPlatformStaff(), loadPlatformAuditLog()]);
  return <AdminUsers staff={staff} auditLog={auditLog} />;
}
