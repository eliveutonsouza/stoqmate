"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { userMessage } from "@/lib/errors";

export async function markNotificationsReadAction(ids?: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_mark_notifications_read", { p_ids: ids ?? null });
  if (error) return { error: userMessage(error, "network-admin/notifications-actions") };
  revalidatePath("/notifications");
  return { ok: true };
}

export async function saveNotificationPreferencesAction(preferences: { key: string; email: boolean }[]) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      preferences.map((p) => ({ tenant_id: tenantId, rule: p.key, email: p.email })),
      { onConflict: "tenant_id,rule" },
    );
  if (error) return { error: userMessage(error, "network-admin/notifications-actions") };

  revalidatePath("/notifications");
  return { ok: true };
}
