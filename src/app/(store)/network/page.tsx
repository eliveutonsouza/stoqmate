import { NetworkDashboard } from '@/features/analysis/network-dashboard';
import { loadNetworkData } from '@/features/analysis/queries';

export default async function Page() {
  const data = await loadNetworkData();
  return <NetworkDashboard {...data} />;
}
