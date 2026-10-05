import "server-only";
import { after } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";

const SEND_INTERVAL_MS = 550;

// Chamado pelas actions que podem gerar aviso (venda, movimentação de
// estoque, pedido de acesso). Roda depois da resposta (after), então não
// atrasa o usuário; falha de envio fica registrada no próprio aviso
// (email_error) e no log, nunca derruba a action.
// A fila é do servidor (service_role), não do usuário: ela devolve o email
// dos proprietários, e um vendedor não pode ler isso nem esvaziar a fila.
export function scheduleNotificationEmails() {
  after(async () => {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.rpc("fn_claim_notification_emails_svc", { p_limit: 20 });
      if (error) {
        console.error("[notification-emails] claim", error.message);
        return;
      }
      const batch = (data ?? []) as { id: string; title: string; message: string; recipients: string[] }[];
      for (const [i, n] of batch.entries()) {
        // Resend aceita ~2 req/s: sem espaçar, o lote estourava em 429.
        if (i > 0) await new Promise((r) => setTimeout(r, SEND_INTERVAL_MS));
        const result = await sendEmail({
          to: n.recipients,
          subject: `Stoqmate · ${n.title}`,
          text: `${n.title}\n\n${n.message}\n\nVeja todos os avisos no painel do Stoqmate, em Avisos.`,
        });
        // Bloqueio da allowlist de teste é definitivo; falha do provedor
        // volta pra fila (até 3 tentativas). Sem o email no log: LGPD.
        const blocked = !result.error && result.blocked.length > 0;
        const problem = result.error ?? (blocked ? `bloqueado pela allowlist (${result.blocked.length} destinatário(s))` : null);
        if (problem) {
          console.warn("[notification-emails]", n.id, problem);
          const rec = await supabase.rpc("fn_record_notification_email_result_svc", { p_id: n.id, p_error: problem, p_retry: !blocked });
          if (rec.error) console.error("[notification-emails] record", rec.error.message);
        }
      }
    } catch (err) {
      console.error("[notification-emails]", err);
    }
  });
}
