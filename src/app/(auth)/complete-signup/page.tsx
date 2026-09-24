import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CompleteSignup } from '@/features/auth/complete-signup';
import { loadPublicPlans } from '@/features/public/queries';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tenantId } = await supabase.rpc('auth_tenant_id');
  if (tenantId) redirect('/dashboard');

  const { plans } = await loadPublicPlans();
  return <CompleteSignup email={user.email ?? ''} plans={plans} />;
}
