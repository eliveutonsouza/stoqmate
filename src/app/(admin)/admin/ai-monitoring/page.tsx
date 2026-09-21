import { AdminAIMonitoring } from '@/features/admin/admin-ai-monitoring';
import { loadAiMonitoring } from '@/features/admin/queries';

export default async function Page() {
  const monitoring = await loadAiMonitoring();
  return <AdminAIMonitoring monitoring={monitoring} />;
}
