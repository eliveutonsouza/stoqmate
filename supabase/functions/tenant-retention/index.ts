// Purga de redes canceladas há mais de 90 dias (fn_retention_days) —
// retenção prometida nos Termos e na Política de privacidade.
// Disparada pelo pg_cron diário (migration 20261005140000). Ordem:
//   1. arquivos da rede e dos membros no Storage (só a API do Storage apaga
//      o arquivo de verdade; DELETE em storage.objects deixa o arquivo órfão);
//   2. a rede no Postgres (cascade em todas as tabelas de domínio);
//   3. os logins dos membros (Admin API do Auth; o perfil cai em cascade).
// Idempotente: falha no meio deixa a rede pra execução seguinte.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const cronSecret = Deno.env.get("RETENTION_CRON_SECRET") ?? "";

const TENANT_BUCKETS = ["store-branding", "product-photos"];
const USER_BUCKETS = ["avatars"];

function sameSecret(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Caminhos são planos: `<prefixo>/<uuid>.<ext>` (src/lib/image-upload.ts).
async function removePrefix(bucket: string, prefix: string) {
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100 });
    if (error) throw new Error(`storage list ${bucket}/${prefix}: ${error.message}`);
    if (!data?.length) return;
    const { error: rmError } = await supabase.storage.from(bucket).remove(data.map((o) => `${prefix}/${o.name}`));
    if (rmError) throw new Error(`storage remove ${bucket}/${prefix}: ${rmError.message}`);
    if (data.length < 100) return;
  }
}

Deno.serve(async (req) => {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!sameSecret(token, cronSecret)) return new Response("unauthorized", { status: 401 });

  const { data: due, error } = await supabase.rpc("fn_tenants_due_for_purge_svc", { p_limit: 20 });
  if (error) {
    console.error("[tenant-retention] due", error.message);
    return new Response("error", { status: 500 });
  }

  let purged = 0;
  for (const t of (due ?? []) as { tenant_id: string; member_ids: string[] }[]) {
    try {
      for (const b of TENANT_BUCKETS) await removePrefix(b, t.tenant_id);
      for (const uid of t.member_ids) for (const b of USER_BUCKETS) await removePrefix(b, uid);

      const { data: ok, error: purgeError } = await supabase.rpc("fn_purge_tenant_svc", {
        p_tenant_id: t.tenant_id, p_users_removed: t.member_ids.length,
      });
      if (purgeError) throw new Error(`purge: ${purgeError.message}`);
      if (!ok) continue; // reativada ou fora do prazo nesse meio-tempo

      for (const uid of t.member_ids) {
        const { error: userError } = await supabase.auth.admin.deleteUser(uid);
        if (userError) console.error("[tenant-retention] deleteUser", t.tenant_id, userError.message);
      }
      purged++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[tenant-retention]", t.tenant_id, message);
      await supabase.rpc("fn_log_purge_error_svc", { p_tenant_id: t.tenant_id, p_error: message });
    }
  }

  return Response.json({ due: due?.length ?? 0, purged });
});
