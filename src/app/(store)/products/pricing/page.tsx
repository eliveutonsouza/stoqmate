import { BulkPricing } from '@/features/analysis/bulk-pricing';
import { loadPricingScopeOptions } from '@/features/analysis/queries';

export default async function Page() {
  const options = await loadPricingScopeOptions();
  return <BulkPricing {...options} />;
}
