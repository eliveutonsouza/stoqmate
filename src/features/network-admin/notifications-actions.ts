"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { userMessage } from "@/lib/errors";
import { allUuids } from "@/lib/validation";
import { PREFERENCE_RULES } from "@/features/network-admin/notifications-queries";

export async function markNotificationsReadAction(ids?: string[]) {
  if (ids != null && (!allUuids(ids) || ids.length > 500)) return { error: "Aviso inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_mark_notifications_read", { p_ids: ids ?? null });
  if (error) return { error: userMessage(error, "network-admin/notifications-actions") };
  revalidatePath("/notifications");
  revalidatePath("/settings/notifications");
  return { ok: true };
}

const READY_RULES = new Set<string>(PREFERENCE_RULES.filter((r) => r.ready).map((r) => r.key));

export async function saveNotificationPreferencesAction(preferences: { key: string; email: boolean }[]) {
  if (!Array.isArray(preferences) || preferences.some((p) => !READY_RULES.has(p.key) || typeof p.email !== "boolean")) {
    return { error: "Regra de aviso inválida." };
  }
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase).catch(() => null);
  if (!tenantId) return { error: "Sessão expirada. Entre de novo." };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      preferences.map((p) => ({ tenant_id: tenantId, rule: p.key, email: p.email })),
      { onConflict: "tenant_id,rule" },
    );
  if (error) return { error: userMessage(error, "network-admin/notifications-actions") };

  revalidatePath("/notifications");
  revalidatePath("/settings/notifications");
  return { ok: true };
}
