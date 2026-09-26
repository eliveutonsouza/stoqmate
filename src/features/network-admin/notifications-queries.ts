import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";

// `ready`: existe evento que gera o aviso (ver fn_notify_low_stock e
// fn_request_access) — só esses aparecem no painel e podem ir por email
// (fila em 20260926110000_notification_emails.sql). Os demais ainda não
// são gerados.
export const PREFERENCE_RULES = [
  { key: "low_stock", title: "Ruptura de estoque", desc: "Quando um SKU chega a zero numa loja", ready: true },
  { key: "below_min", title: "Estoque abaixo do mínimo", desc: "Quando um SKU cruza o estoque mínimo numa loja", ready: true },
  { key: "access_request", title: "Pedido de acesso", desc: "Quando alguém da equipe pede acesso a uma tela", ready: true },
  { key: "transfers_pending", title: "Transferências pendentes", desc: "Recebimento não confirmado em 48 h", ready: false },
  { key: "count_divergence", title: "Divergência de inventário", desc: "Ajustes acima de R$ 200", ready: false },
  { key: "promo_ending", title: "Promoções encerrando", desc: "Dois dias antes do fim da vigência", ready: false },
  { key: "billing", title: "Cobrança e faturas", desc: "Fatura emitida, paga ou vencida", ready: false },
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
