import { createClient, getTenantId } from "@/lib/supabase/server";

export async function loadFiscalMode() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("fiscal_mode").single();
  return data?.fiscal_mode ?? "later";
}

export async function loadCompanyData() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("name, cnpj").single();
  return { name: data?.name ?? "", cnpj: data?.cnpj ?? "" };
}

export async function loadBranding() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("name, logo_url, brand_color").single();
  return { name: data?.name ?? "", logoUrl: data?.logo_url ?? null, brandColor: data?.brand_color ?? "#E94B1C" };
}

export async function loadProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: factors }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.auth.mfa.listFactors(),
  ]);

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

  const [{ data: members }, { data: invites }, { data: tenant }] = await Promise.all([
    supabase.rpc("fn_team_members"),
    supabase.rpc("fn_team_pending_invites"),
    supabase.from("tenants").select("plan_id, plans(name, limits)").eq("id", tenantId).maybeSingle(),
  ]);

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
  };
}
