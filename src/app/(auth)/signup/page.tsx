import { Signup } from '@/features/auth/signup';
import { loadPublicPlans } from '@/features/public/queries';

export const revalidate = 300;

export default async function Page() {
  const data = await loadPublicPlans();
  return <Signup {...data} />;
}
