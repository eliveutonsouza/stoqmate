import { createClient, getTenantId } from "@/lib/supabase/server";

export async function loadBillingState() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const [{ data: subscription }, { data: invoices }, { data: plans }, { data: tenant }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("invoices").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(12),
    supabase.from("plans").select("*").eq("active", true).order("monthly_price"),
    supabase.from("tenants").select("plan_id").eq("id", tenantId).maybeSingle(),
  ]);

  return {
    subscription: subscription ?? null,
    invoices: invoices ?? [],
    plans: plans ?? [],
    currentPlanId: subscription?.plan_id ?? tenant?.plan_id ?? "balcao",
  };
}
