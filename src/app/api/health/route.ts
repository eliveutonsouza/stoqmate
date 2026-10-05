import { createPublicClient } from "@/lib/supabase/public";

// Health check pra uptime monitor. Rota técnica (como /auth/callback), fora
// do proxy de sessão. Consulta barata ao banco pelo papel anon, com timeout;
// resposta sem detalhe de infra — só se cada dependência respondeu.
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "down" = "down";
  try {
    const { error } = await createPublicClient()
      .rpc("fn_platform_trial_days")
      .abortSignal(AbortSignal.timeout(DB_TIMEOUT_MS));
    db = error ? "down" : "ok";
    if (error) console.error("[health] db", error.message);
  } catch (err) {
    console.error("[health] db", err instanceof Error ? err.message : err);
  }
  const ok = db === "ok";
  return Response.json(
    { status: ok ? "ok" : "degraded", db, latencyMs: Date.now() - startedAt },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
