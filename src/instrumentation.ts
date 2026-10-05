// Roda uma vez na subida de cada instância do servidor (convenção do Next).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertServerEnv } = await import("@/lib/server-env");
  assertServerEnv();
}
