import { Pricing } from '@/features/auth/pricing';
import { loadPublicPlans } from '@/features/public/queries';

export const revalidate = 300;

export default async function Page() {
  const data = await loadPublicPlans();
  return <Pricing {...data} />;
}
