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

  if (planId && (sub.status === "active" || sub.status === "trialing")) {
    await supabase.from("tenants").update({ plan_id: planId }).eq("id", tenantId);
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
