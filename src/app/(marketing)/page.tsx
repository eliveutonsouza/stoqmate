import { Landing } from '@/features/landing/landing';
import { loadPublicPlans } from '@/features/public/queries';

export const revalidate = 300;

export default async function Page() {
  const data = await loadPublicPlans();
  return <Landing {...data} />;
}
