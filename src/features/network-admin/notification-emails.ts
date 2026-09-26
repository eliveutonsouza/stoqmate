import "server-only";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

// Chamado pelas actions que podem gerar aviso (venda, movimentação de
// estoque, pedido de acesso). Roda depois da resposta (after), então não
// atrasa o usuário; falha de envio fica registrada no próprio aviso
// (email_error) e no log, nunca derruba a action.
export function scheduleNotificationEmails() {
  after(async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("fn_claim_notification_emails", { p_limit: 20 });
      if (error) {
        console.error("[notification-emails] claim", error.message);
        return;
      }
      for (const n of (data ?? []) as { id: string; title: string; message: string; recipients: string[] }[]) {
        const result = await sendEmail({
          to: n.recipients,
          subject: `Stoqmate · ${n.title}`,
          text: `${n.title}\n\n${n.message}\n\nVeja todos os avisos no painel do Stoqmate, em Avisos.`,
        });
        const problem = result.error ?? (result.blocked.length ? `bloqueado pela allowlist: ${result.blocked.join(", ")}` : null);
        if (problem) {
          console.warn("[notification-emails]", n.id, problem);
          const rec = await supabase.rpc("fn_record_notification_email_result", { p_id: n.id, p_error: problem });
          if (rec.error) console.error("[notification-emails] record", rec.error.message);
        }
      }
    } catch (err) {
      console.error("[notification-emails]", err);
    }
  });
}
