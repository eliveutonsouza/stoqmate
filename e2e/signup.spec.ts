import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Confirmação de email ligada em produção: o cadastro cai em /verify-email e
// o tenant só nasce depois da confirmação. O endereço é a caixa de teste do
// Resend (aceita +rótulo e não volta como bounce) — domínio inventado gerava
// bounce a cada execução e queimava a reputação do remetente.
test("signup pede confirmação e, confirmado, cai no onboarding", async ({ page }) => {
  const email = `delivered+e2e-signup-${Date.now()}@resend.dev`;
  const password = "SignupPass123";
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByPlaceholder("Seu nome completo").fill("Signup E2E");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(email);
    await page.getByPlaceholder("••••••••").fill(password);
    await page.getByPlaceholder("Ex.: Loja Centro").fill(`Loja E2E ${Date.now()}`);
    // Aceite é obrigatório e começa desmarcado (LGPD).
    await page.getByRole("button", { name: /criar loja e configurar/i }).click();
    await expect(page.getByText("Aceite os termos de uso pra continuar.")).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /criar loja e configurar/i }).click();
    await expect(page).toHaveURL(/\/verify-email\?email=/);

    // Sem confirmar, o login não entra.
    const created = await findUser(admin, email);
    expect(created?.email_confirmed_at ?? null).toBeNull();

    // Confirma como o link do email faria e entra: o cadastro pendente
    // (user_metadata) vira tenant no primeiro login.
    await admin.auth.admin.updateUserById(created!.id, { email_confirm: true });
    await page.goto("/login");
    await page.getByPlaceholder("voce@sualoja.com.br").fill(email);
    await page.getByPlaceholder("••••••••").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/onboarding");
  } finally {
    // Limpeza: signup real cria auth.users + tenant de verdade.
    const created = await findUser(admin, email);
    if (created) {
      const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", created.id).maybeSingle();
      if (profile?.tenant_id) await admin.from("tenants").delete().eq("id", profile.tenant_id);
      await admin.auth.admin.deleteUser(created.id);
    }
  }
});

async function findUser(admin: { auth: SupabaseClient["auth"] }, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = data.users.find((u) => u.email === email);
    if (found || data.users.length < 200) return found ?? null;
  }
  return null;
}
