// Stripe -> Postgres. Primeira Edge Function do projeto.
// Verifica a assinatura com STRIPE_WEBHOOK_SECRET, resolve o tenant pelo
// stripe_customer_id (gravado em billing_customers no checkout) e grava
// direto com o service_role — RLS não se aplica aqui por design (só este
// webhook e os Server Actions de checkout/portal escrevem nessas tabelas).
import Stripe from "npm:stripe@18";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// O client do Supabase devolve { error } em vez de lançar. Sem checar, uma
// escrita que falha respondia 200 e o Stripe nunca reentregava o evento
// (pagamento perdido em silêncio). Toda escrita passa por aqui: erro vira
// exceção -> 500 -> o Stripe tenta de novo.
function must<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

// Customer sem tenant mapeado lança (500) em vez de ignorar: o mapeamento é
// gravado no checkout antes do redirect pro Stripe, então ausência aqui é
// corrida ou bug — ambos merecem retry e log, não 200 silencioso.
async function tenantIdForCustomer(customerId: string): Promise<string> {
  const data = must(
    await supabase.from("billing_customers").select("tenant_id").eq("stripe_customer_id", customerId).maybeSingle(),
    "billing_customers lookup",
  );
  if (!data?.tenant_id) throw new Error(`no tenant found for customer ${customerId}`);
  return data.tenant_id;
}

async function planIdForPrice(priceId: string | undefined): Promise<string | null> {
  if (!priceId) return null;
  const data = must(
    await supabase
      .from("plans")
      .select("id")
      .or(`stripe_price_monthly_id.eq.${priceId},stripe_price_yearly_id.eq.${priceId}`)
      .limit(1)
      .maybeSingle(),
    "plans lookup",
  );
  if (!data) console.error("stripe price not mapped to any plan", priceId);
  return data?.id ?? null;
}

// Stripe status -> tenants.status (enum trial|active|past_due|canceled).
// Estados intermediários do Stripe sem equivalente direto (incomplete,
// incomplete_expired, unpaid) não mexem no status do tenant — mapear pra
// um dos 4 seria inventar um significado que o Stripe não deu.
function tenantStatusFor(stripeStatus: Stripe.Subscription.Status): string | null {
  const map: Partial<Record<Stripe.Subscription.Status, string>> = {
    trialing: "trial", active: "active", past_due: "past_due", canceled: "canceled",
  };
  return map[stripeStatus] ?? null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const tenantId = await tenantIdForCustomer(sub.customer as string);
  const item = sub.items.data[0];
  const planId = await planIdForPrice(item?.price?.id);
  const cycle = item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
  // Stripe moveu current_period_end pro item em versões recentes da API;
  // aceita os dois formatos pra não quebrar se a conta usar uma mais velha.
  // deno-lint-ignore no-explicit-any
  const periodEndTs = (item as any)?.current_period_end ?? (sub as any).current_period_end;

  must(await supabase.from("subscriptions").upsert({
    tenant_id: tenantId,
    stripe_subscription_id: sub.id,
    plan_id: planId,
    cycle,
    status: sub.status,
    current_period_end: periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" }), "subscriptions upsert");

  const newStatus = tenantStatusFor(sub.status);
  if (newStatus) must(await supabase.from("tenants").update({ status: newStatus }).eq("id", tenantId), "tenant status");

  if (planId && (sub.status === "active" || sub.status === "trialing")) {
    const tenant = must(await supabase.from("tenants").select("plan_id").eq("id", tenantId).maybeSingle(), "tenant lookup");
    // Update condicional (plan_id <> novo) é atômico: quando checkout.session.
    // completed e customer.subscription.created chegam juntos, só um deles
    // "ganha" a troca — o outro volta 0 linhas e não duplica ledger/evento.
    const changed = must(
      await supabase.from("tenants").update({ plan_id: planId }).eq("id", tenantId).neq("plan_id", planId).select("id"),
      "tenant plan update",
    );
    // Ajusta a cota de IA na hora quando o plano muda de verdade — não
    // espera o cron mensal (fn_ai_renew_cycle). Realinha ai_credit_renews_at
    // com o ciclo real da assinatura em vez do aniversário genérico.
    if (changed && changed.length > 0) {
      const renewsAt = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;
      must(await supabase.rpc("fn_ai_apply_plan_change", { p_tenant_id: tenantId, p_plan_id: planId, p_renews_at: renewsAt }), "apply plan change");
      must(await supabase.from("tenant_lifecycle_events").insert({
        tenant_id: tenantId, event_type: "plan_change", from_plan_id: tenant?.plan_id ?? null, to_plan_id: planId,
      }), "lifecycle plan_change");
    }
  }
}

// Pacote avulso: só credita com pagamento confirmado. Métodos assíncronos
// (boleto/pix) completam o checkout com payment_status "unpaid" e só pagam
// depois, em checkout.session.async_payment_succeeded.
async function creditPackIfPaid(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment" || !session.metadata?.pack_id) return;
  if (session.payment_status !== "paid") return;
  if (!session.metadata.tenant_id) throw new Error(`pack checkout ${session.id} without tenant_id metadata`);
  // fn_ai_credit_pack_purchase é idempotente (unique em
  // stripe_checkout_session_id): reentrega não credita em dobro.
  must(await supabase.rpc("fn_ai_credit_pack_purchase", {
    p_tenant_id: session.metadata.tenant_id, p_pack_id: session.metadata.pack_id, p_stripe_checkout_session_id: session.id,
  }), "credit pack purchase");
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) return new Response("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("signature verification failed", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await syncSubscription(sub);
        } else {
          await creditPackIfPaid(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await creditPackIfPaid(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        must(await supabase.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", sub.id), "subscription cancel");
        const tenantId = await tenantIdForCustomer(sub.customer as string);
        // Só registra churn na transição real (reentrega não duplica evento).
        const canceled = must(
          await supabase.from("tenants").update({ status: "canceled" }).eq("id", tenantId).neq("status", "canceled").select("id"),
          "tenant cancel",
        );
        if (canceled && canceled.length > 0) {
          must(await supabase.from("tenant_lifecycle_events").insert({ tenant_id: tenantId, event_type: "canceled" }), "lifecycle canceled");
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const tenantId = await tenantIdForCustomer(invoice.customer as string);
        must(await supabase.from("invoices").upsert({
          tenant_id: tenantId,
          stripe_invoice_id: invoice.id,
          amount_paid: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency,
          status: invoice.status,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
        }, { onConflict: "stripe_invoice_id" }), "invoice upsert");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return new Response("handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
