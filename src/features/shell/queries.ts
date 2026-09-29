import { cache } from "react";
import { cookies } from "next/headers";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { ROLES } from "@/lib/permissions";

// Dados do chrome (sidebar, header, breadcrumb) — antes vinham de MOCK
// ("Bonsucesso Varejo", "Ana Ribeiro", contadores fixos). Carregados uma vez
// por request no layout do grupo e entregues via ShellProvider.

export const ACTIVE_STORE_COOKIE = "stoqmate_store";

export type ShellCounts = {
  products: number;
  categories: number;
  customers: number;
  suppliers: number;
  stores: number;
  open_orders: number;
  active_promos: number;
  unread_notifications: number;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const loadStoreShell = cache(async () => {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return null;

  // Contadores da sidebar (8 count(*) sob RLS) não seguram a navegação: a
  // promise vai pro cliente pelo mesmo stream e os badges aparecem quando
  // resolver.
  const counts: Promise<ShellCounts> = Promise.resolve(supabase.rpc("fn_shell_counts"))
    .then((res) => must(res, "shell.counts") as ShellCounts);

  const [profile, tenant, stores, role] = await Promise.all([
    supabase.from("profiles").select("full_name, initials").eq("id", user.id).maybeSingle(),
    supabase.from("tenants").select("id, name, logo_url, brand_color, cash_control").maybeSingle(),
    supabase.from("stores").select("id, name, type").order("created_at"),
    supabase.rpc("auth_role"),
  ]);

  const storeList = must(stores, "shell.stores") ?? [];
  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;
  const activeStore = storeList.find((s) => s.id === preferred) ?? storeList[0] ?? null;

  const fullName = must(profile, "shell.profile")?.full_name || user.email || "";
  const roleId = must(role, "shell.role") as string | null;

  return {
    tenant: must(tenant, "shell.tenant"),
    stores: storeList,
    activeStore,
    user: {
      name: fullName,
      initials: profile.data?.initials || initialsOf(fullName),
      roleId,
      role: ROLES.find((r) => r.id === roleId)?.name ?? "",
    },
    counts,
  };
});

export type StoreShellData = NonNullable<Awaited<ReturnType<typeof loadStoreShell>>>;

export const loadAdminShell = cache(async () => {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return null;

  const [profile, staff] = await Promise.all([
    supabase.from("profiles").select("full_name, initials").eq("id", user.id).maybeSingle(),
    supabase.from("platform_staff").select("role").eq("user_id", user.id).maybeSingle(),
  ]);
  const fullName = must(profile, "adminShell.profile")?.full_name || user.email || "";
  const STAFF_LABEL: Record<string, string> = {
    super_admin: "Super Admin", suporte: "Suporte", engenharia: "Engenharia", comercial: "Comercial",
  };
  const staffRole = must(staff, "adminShell.staff")?.role as string | undefined;

  return {
    user: {
      name: fullName,
      initials: profile.data?.initials || initialsOf(fullName),
      role: staffRole ? STAFF_LABEL[staffRole] ?? staffRole : "",
    },
  };
});

// Loja preferida (sidebar) — telas com seletor de unidade usam como padrão.
export async function loadActiveStoreId() {
  return (await loadStoreShell())?.activeStore?.id ?? null;
}

// Loja de uma tela com seletor de unidade: a pedida na URL (se for da rede),
// senão a ativa da sidebar, senão a primeira. Antes as telas pegavam
// stores[0] (ordem alfabética) e ignoravam o seletor da sidebar.
export async function resolveStoreId(stores: { id: string }[], requested?: string | null) {
  if (requested && stores.some((s) => s.id === requested)) return requested;
  const active = await loadActiveStoreId();
  if (active && stores.some((s) => s.id === active)) return active;
  return stores[0]?.id ?? null;
}
