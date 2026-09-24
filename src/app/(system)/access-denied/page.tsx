import { AccessDenied } from '@/features/system/access-denied';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc('auth_role');
  return <AccessDenied role={(role as string | null) ?? null} />;
}
