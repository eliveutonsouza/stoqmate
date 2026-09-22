import { NetworkUnits } from '@/features/network-admin/network-units';
import { loadNetworkUnits } from '@/features/network-admin/units-queries';

export default async function Page() {
  const data = await loadNetworkUnits();
  return <NetworkUnits {...data} />;
}
