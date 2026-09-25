import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

export const PREFERENCE_RULES = [
  { key: "low_stock", title: "Ruptura de estoque", desc: "Quando um SKU chega a zero" },
  { key: "below_min", title: "Estoque abaixo do mínimo", desc: "Resumo diário dos itens em alerta" },
  { key: "transfers_pending", title: "Transferências pendentes", desc: "Recebimento não confirmado em 48 h" },
  { key: "count_divergence", title: "Divergência de inventário", desc: "Ajustes acima de R$ 200" },
  { key: "promo_ending", title: "Promoções encerrando", desc: "Dois dias antes do fim da vigência" },
  { key: "billing", title: "Cobrança e faturas", desc: "Fatura emitida, paga ou vencida" },
] as const;

export async function loadNotifications() {
  const supabase = await createClient();
  const data = must(await supabase
    .from("notifications")
    .select("id, kind, title, message, target_type, target_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100), "network-admin/notifications-queries.loadNotifications.data");
  return data ?? [];
}

export async function loadNotificationPreferences() {
  const supabase = await createClient();
  const data = must(await supabase.from("notification_preferences").select("rule, email"), "network-admin/notifications-queries.loadNotificationPreferences.data");
  const byRule = Object.fromEntries((data ?? []).map((r) => [r.rule, r.email]));
  return PREFERENCE_RULES.map((r) => ({ ...r, email: byRule[r.key] ?? false }));
}
