import { requireStaff } from "@/features/admin/queries";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";
import { getAnthropic } from "@/lib/anthropic";

// Saúde dos serviços medida no momento em que o console abre — antes o card
// mostrava latência/uptime fixos (e a IA sempre "degradada"). Não há
// histórico de uptime guardado, então o card não promete "últimas 24h".

export type ServiceCheck = {
  name: string;
  status: "ok" | "error" | "unconfigured";
  latencyMs: number | null;
  detail: string | null;
};

const TIMEOUT_MS = 4000;

async function check(name: string, run: () => Promise<unknown>, configured = true): Promise<ServiceCheck> {
  if (!configured) return { name, status: "unconfigured", latencyMs: null, detail: "Chave não configurada" };
  const started = Date.now();
  try {
    await Promise.race([
      run(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`sem resposta em ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)),
    ]);
    return { name, status: "ok", latencyMs: Date.now() - started, detail: null };
  } catch (err) {
    return { name, status: "error", latencyMs: null, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function loadSystemHealth() {
  await requireStaff();
  const admin = createServiceRoleClient();

  const services = await Promise.all([
    check("Banco · Postgres", async () => {
      const { error } = await admin.from("plans").select("id").limit(1);
      if (error) throw new Error(error.message);
    }),
    check("Storage", async () => {
      const { error } = await admin.storage.getBucket("product-photos");
      if (error) throw new Error(error.message);
    }),
    check("Stripe · API", () => getStripe().balance.retrieve(), !!process.env.STRIPE_SECRET_KEY),
    check("Anthropic · Claude", () => getAnthropic().models.list({ limit: 1 }), !!process.env.ANTHROPIC_API_KEY),
  ]);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [total, failed] = await Promise.all([
    admin.from("ai_usage_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("ai_usage_log").select("id", { count: "exact", head: true }).gte("created_at", since).eq("status", "error"),
  ]);
  const aiCalls = total.error ? null : total.count ?? 0;
  const aiErrors = failed.error ? null : failed.count ?? 0;

  return { services, aiCalls, aiErrors, checkedAt: new Date().toISOString() };
}
