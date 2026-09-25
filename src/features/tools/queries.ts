import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export async function loadAuditLog() {
  const supabase = await createClient();
  const entries = must(await supabase
    .from("audit_log")
    .select("id, kind, message, target_type, target_id, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(200), "tools/queries.loadAuditLog.entries");

  const userIds = [...new Set((entries ?? []).map((e) => e.created_by).filter(Boolean))];
  const profiles = userIds.length
    ? must(await supabase.from("profiles").select("id, full_name").in("id", userIds), "tools/queries.profiles")
    : [];
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));

  return (entries ?? []).map((e) => ({ ...e, who: nameById[e.created_by ?? ""] || "Usuário" }));
}
