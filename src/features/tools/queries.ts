import { createClient } from "@/lib/supabase/server";

export async function loadAuditLog() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, kind, message, target_type, target_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = [...new Set((entries ?? []).map((e) => e.created_by).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));

  return (entries ?? []).map((e) => ({ ...e, who: nameById[e.created_by ?? ""] || "Usuário" }));
}
