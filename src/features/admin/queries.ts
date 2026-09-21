import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// cache() dedupe a checagem is_platform_staff quando uma página admin chama
// 2+ funções deste arquivo na mesma requisição (ex.: admin/users/page.tsx).
export const requireStaff = cache(async () => {
  const supabase = await createClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) throw new Error("not authorized");
  return supabase;
});

export async function loadTenantsOverview() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, cnpj, plan_id, created_at, stores(id), products(count)")
    .order("created_at", { ascending: false });
  return (tenants ?? []).map((t) => {
    const products = t.products as unknown as { count: number }[];
    return { ...t, storeCount: t.stores?.length ?? 0, skuCount: products?.[0]?.count ?? 0 };
  });
}

export async function loadTenantDetail(tenantId: string) {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: tenant }, { data: stores }, { data: storeUsers }, { data: auditLog }, { count: skuCount }] = await Promise.all([
    admin.from("tenants").select("id, name, cnpj, plan_id, created_at").eq("id", tenantId).maybeSingle(),
    admin.from("stores").select("id, name, type").eq("tenant_id", tenantId).order("name"),
    admin.from("store_users").select("user_id, role, status, created_at").eq("tenant_id", tenantId),
    admin.from("audit_log").select("id, kind, message, scope, created_at, created_by").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50),
    admin.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);
  if (!tenant) return null;

  const userIds = (storeUsers ?? []).map((u) => u.user_id);
  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    userIds.length ? admin.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));
  const emailById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email]));

  return {
    tenant,
    stores: stores ?? [],
    users: (storeUsers ?? []).map((u) => ({ ...u, name: nameById[u.user_id] || "Usuário", email: emailById[u.user_id] || "" })),
    auditLog: (auditLog ?? []).map((a) => ({ ...a, who: nameById[a.created_by ?? ""] || emailById[a.created_by ?? ""] || "—" })),
    skuCount: skuCount ?? 0,
  };
}

export async function loadPlatformStaff() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data: staff } = await admin.from("platform_staff").select("user_id, role, mfa_required, created_at").order("created_at");
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const userById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u]));

  return (staff ?? []).map((s) => {
    const u = userById[s.user_id];
    return { ...s, email: u?.email ?? "", lastSignInAt: u?.last_sign_in_at ?? null };
  });
}

export async function loadPlatformAuditLog() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: entries }, { data: authUsers }] = await Promise.all([
    admin
      .from("audit_log")
      .select("id, kind, message, target_type, target_id, created_by, created_at, tenant_id")
      .eq("scope", "platform")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email]));
  const tenantIds = [...new Set((entries ?? []).map((e) => e.tenant_id))];
  const { data: tenants } = tenantIds.length ? await admin.from("tenants").select("id, name").in("id", tenantIds) : { data: [] };
  const tenantNameById = Object.fromEntries((tenants ?? []).map((t) => [t.id, t.name]));

  return (entries ?? []).map((e) => ({ ...e, who: emailById[e.created_by ?? ""] || "—", tenantName: tenantNameById[e.tenant_id] || "—" }));
}

export async function loadPlans() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data } = await admin.from("plans").select("*").order("monthly_price");
  return data ?? [];
}

export async function loadPlan(id: string) {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data } = await admin.from("plans").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
