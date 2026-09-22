import { TabletPOS } from '@/features/pos/tablet-pos';
import { loadPosData } from '@/features/pos/queries';

export default async function Page() {
  const data = await loadPosData();
  return <TabletPOS {...data} />;
}
