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

async function tenantIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase.from("billing_customers").select("tenant_id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.tenant_id ?? null;
}

async function planIdForPrice(priceId: string | undefined): Promise<string | null> {
  if (!priceId) return null;
  const { data } = await supabase
    .from("plans")
    .select("id")
    .or(`stripe_price_monthly_id.eq.${priceId},stripe_price_yearly_id.eq.${priceId}`)
    .maybeSingle();
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
  if (!tenantId) {
    console.error("no tenant found for customer", sub.customer);
    return;
  }
  const item = sub.items.data[0];
  const planId = await planIdForPrice(item?.price?.id);
  const cycle = item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
  // Stripe moveu current_period_end pro item em versões recentes da API;
  // aceita os dois formatos pra não quebrar se a conta usar uma mais velha.
  // deno-lint-ignore no-explicit-any
  const periodEndTs = (item as any)?.current_period_end ?? (sub as any).current_period_end;

  await supabase.from("subscriptions").upsert({
    tenant_id: tenantId,
    stripe_subscription_id: sub.id,
    plan_id: planId,
    cycle,
    status: sub.status,
    current_period_end: periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });

  const newStatus = tenantStatusFor(sub.status);
  if (newStatus) await supabase.from("tenants").update({ status: newStatus }).eq("id", tenantId);

  if (planId && (sub.status === "active" || sub.status === "trialing")) {
    const { data: tenant } = await supabase.from("tenants").select("plan_id").eq("id", tenantId).maybeSingle();
    await supabase.from("tenants").update({ plan_id: planId }).eq("id", tenantId);
    // Ajusta a cota de IA na hora quando o plano muda de verdade — não
    // espera o cron mensal (fn_ai_renew_cycle). Realinha ai_credit_renews_at
    // com o ciclo real da assinatura em vez do aniversário genérico.
    if (tenant && tenant.plan_id !== planId) {
      const renewsAt = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;
      await supabase.rpc("fn_ai_apply_plan_change", { p_tenant_id: tenantId, p_plan_id: planId, p_renews_at: renewsAt });
      await supabase.from("tenant_lifecycle_events").insert({
        tenant_id: tenantId, event_type: "plan_change", from_plan_id: tenant.plan_id, to_plan_id: planId,
      });
    }
  }
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
        } else if (session.mode === "payment" && session.metadata?.pack_id) {
          // Compra de pacote avulso de crédito de IA — fn_ai_credit_pack_purchase
          // é idempotente (unique em stripe_checkout_session_id), então uma
          // reentrega do mesmo evento não credita em dobro.
          await supabase.rpc("fn_ai_credit_pack_purchase", {
            p_tenant_id: session.metadata.tenant_id, p_pack_id: session.metadata.pack_id, p_stripe_checkout_session_id: session.id,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", sub.id);
        const tenantId = await tenantIdForCustomer(sub.customer as string);
        if (tenantId) {
          await supabase.from("tenants").update({ status: "canceled" }).eq("id", tenantId);
          await supabase.from("tenant_lifecycle_events").insert({ tenant_id: tenantId, event_type: "canceled" });
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const tenantId = await tenantIdForCustomer(invoice.customer as string);
        if (tenantId) {
          await supabase.from("invoices").upsert({
            tenant_id: tenantId,
            stripe_invoice_id: invoice.id,
            amount_paid: (invoice.amount_paid ?? 0) / 100,
            currency: invoice.currency,
            status: invoice.status,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          }, { onConflict: "stripe_invoice_id" });
        }
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
