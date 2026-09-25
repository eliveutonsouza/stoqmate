import { redirect } from 'next/navigation';
import { CompleteSignup } from '@/features/auth/complete-signup';
import { loadCompleteSignupState } from '@/features/auth/queries';
import { loadPublicPlans } from '@/features/public/queries';

export default async function Page() {
  const { user, hasTenant } = await loadCompleteSignupState();
  if (!user) redirect('/login');
  if (hasTenant) redirect('/dashboard');
  const { plans } = await loadPublicPlans();
  return <CompleteSignup email={user.email} plans={plans} />;
}
