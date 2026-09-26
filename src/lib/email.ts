import "server-only";

// Envio de email transacional pela API do Resend (sem SDK: 1 POST).
//
// Trava de teste: EMAIL_TEST_ALLOWLIST (vírgula; "@dominio" libera o
// domínio inteiro). Com a variável definida, destinatário fora da lista é
// descartado e registrado como bloqueado — assim o domínio de teste nunca
// manda email pra cliente real. Variável ausente = sem trava (produção).

export type EmailResult = { sent: string[]; blocked: string[]; error?: string };

export function parseAllowlist(raw: string | undefined): string[] | null {
  if (raw === undefined) return null;
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function isAllowed(email: string, allowlist: string[] | null) {
  if (allowlist === null) return true;
  const e = email.trim().toLowerCase();
  return allowlist.some((rule) => (rule.startsWith("@") ? e.endsWith(rule) : e === rule));
}

export async function sendEmail(input: { to: string[]; subject: string; text: string; html?: string }): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const allowlist = parseAllowlist(process.env.EMAIL_TEST_ALLOWLIST);
  const to = input.to.filter((e) => isAllowed(e, allowlist));
  const blocked = input.to.filter((e) => !isAllowed(e, allowlist));

  if (!apiKey || !from) return { sent: [], blocked, error: "RESEND_API_KEY/EMAIL_FROM não configurados" };
  if (to.length === 0) return { sent: [], blocked, error: blocked.length ? "todos os destinatários fora da allowlist de teste" : "sem destinatários" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: [], blocked, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: to, blocked };
  } catch (err) {
    return { sent: [], blocked, error: `Resend falhou: ${err instanceof Error ? err.message : String(err)}` };
  }
}
