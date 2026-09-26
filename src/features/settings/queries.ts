import { createClient, getTenantId } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export async function loadFiscalMode() {
  const supabase = await createClient();
  const data = must(await supabase.from("tenants").select("fiscal_mode").single(), "settings/queries.loadFiscalMode.data");
  return data?.fiscal_mode ?? "later";
}

export async function loadCompanyData() {
  const supabase = await createClient();
  const data = must(await supabase.from("tenants").select("name, cnpj").single(), "settings/queries.loadCompanyData.data");
  return { name: data?.name ?? "", cnpj: data?.cnpj ?? "" };
}

export async function loadBranding() {
  const supabase = await createClient();
  const data = must(await supabase.from("tenants").select("name, logo_url, brand_color").single(), "settings/queries.loadBranding.data");
  return { name: data?.name ?? "", logoUrl: data?.logo_url ?? null, brandColor: data?.brand_color ?? "#E94B1C" };
}

export async function loadProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, factorsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.auth.mfa.listFactors(),
  ]);
  const profile = must(profileRes, "settings/queries.loadProfile.profile");
  const factors = must(factorsRes, "settings/queries.loadProfile.factors");

  const verifiedFactor = (factors?.totp ?? []).find((f) => f.status === "verified");
  return {
    email: user.email ?? "",
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    mfaEnabled: !!verifiedFactor,
    mfaFactorId: verifiedFactor?.id ?? null,
  };
}

export async function loadTeam() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const { data: { user } } = await supabase.auth.getUser();

  const [membersRes, invitesRes, tenantRes] = await Promise.all([
    supabase.rpc("fn_team_members"),
    supabase.rpc("fn_team_pending_invites"),
    supabase.from("tenants").select("plan_id, plans(name, limits)").eq("id", tenantId).maybeSingle(),
  ]);
  const members = must(membersRes, "settings/queries.loadTeam.members");
  const invites = must(invitesRes, "settings/queries.loadTeam.invites");
  const tenant = must(tenantRes, "settings/queries.loadTeam.tenant");

  // PostgREST devolve o embed como array quando não consegue provar
  // cardinalidade 1 pelo schema — mesmo caso já tratado em loadSubscriptionDetail.
  const planRaw = tenant?.plans;
  const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
  const seatLimit = Number(plan?.limits?.users ?? 0);

  return {
    members: members ?? [],
    invites: invites ?? [],
    planName: plan?.name ?? "—",
    seatLimit,
    seatsUsed: (members?.length ?? 0) + (invites?.length ?? 0),
    currentUserId: user?.id ?? null,
  };
}

// Números dos cards do hub de Configurações (antes fixos: "4/5 unidades",
// "6/10 usuários", "Controle R$ 89", "6 categorias / 12 atributos").
export async function loadSettingsHub() {
  const supabase = await createClient();
  const [tenantRes, storesRes, usersRes, catsRes, attrsRes] = await Promise.all([
    supabase.from("tenants").select("plan:plans(name, monthly_price, limits)").single(),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("type", "loja"),
    supabase.from("store_users").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("category_attributes").select("id", { count: "exact", head: true }),
  ]);
  const tenant = must(tenantRes, "settings.hub.tenant");
  must(storesRes, "settings.hub.stores");
  must(usersRes, "settings.hub.users");
  must(catsRes, "settings.hub.categories");
  must(attrsRes, "settings.hub.attributes");
  const plan = (Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan) as
    | { name: string; monthly_price: number; limits: { stores?: number | null; users?: number | null } | null }
    | null
    | undefined;

  return {
    stores: storesRes.count ?? 0,
    storeLimit: plan?.limits?.stores ?? null,
    users: usersRes.count ?? 0,
    userLimit: plan?.limits?.users ?? null,
    planName: plan?.name ?? null,
    monthlyPrice: plan ? Number(plan.monthly_price) : null,
    categories: catsRes.count ?? 0,
    attributes: attrsRes.count ?? 0,
  };
}
