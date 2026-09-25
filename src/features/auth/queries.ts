import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

// Quem chega em /complete-signup: sem sessão, ou já com empresa, não tem o
// que completar — o page decide o redirect a partir disto.
export async function loadCompleteSignupState() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, hasTenant: false };
  const tenantId = must(await supabase.rpc("auth_tenant_id"), "completeSignup.tenant");
  return { user: { email: user.email ?? "" }, hasTenant: !!tenantId };
}
