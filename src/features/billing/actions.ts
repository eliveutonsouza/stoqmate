"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";
import { siteOrigin } from "@/lib/site-origin";

const STRIPE_ERROR = "Não foi possível falar com o provedor de pagamento agora. Tente de novo em instantes.";

type BillingAccess =
  | { supabase: SupabaseClient; tenantId: string; error: null }
  | { supabase: null; tenantId: null; error: string };

async function requireBillingAccess(): Promise<BillingAccess> {
  const supabase = await createClient();
  const [{ data: allowed }, { data: tenantId }] = await Promise.all([
    supabase.rpc("has_access", { p_area: "billing", p_min_level: 2 }),
    supabase.rpc("auth_tenant_id"),
  ]);
  if (!allowed || !tenantId) {
    return { supabase: null, tenantId: null, error: "Seu perfil não tem permissão para gerenciar a assinatura." };
  }
  return { supabase, tenantId: tenantId as string, error: null };
}

// Idempotente sob concorrência: dois checkouts simultâneos criavam 2
// customers no Stripe e o segundo insert falhava em silêncio, deixando o
// checkout apontado pra um customer sem mapeamento (o webhook não achava o
// tenant e a assinatura paga sumia). Agora o insert ignora conflito, relê o
// vencedor e descarta o customer perdedor no Stripe.
async function ensureStripeCustomer(tenantId: string): Promise<string> {
  const admin = createServiceRoleClient();
  const { data: existing } = await admin.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle();
  if (existing) return existing.stripe_customer_id;

  const [{ data: tenant }, { data: owner }] = await Promise.all([
    admin.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
    admin.from("store_users").select("user_id").eq("tenant_id", tenantId).eq("role", "proprietario").order("created_at").limit(1).maybeSingle(),
  ]);
  const { data: ownerUser } = owner ? await admin.auth.admin.getUserById(owner.user_id) : { data: null };

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant?.name ?? "Rede Stoqmate",
    email: ownerUser?.user?.email ?? undefined,
    metadata: { tenant_id: tenantId },
  });

  const { error: insertError } = await admin
    .from("billing_customers")
    .upsert({ tenant_id: tenantId, stripe_customer_id: customer.id }, { onConflict: "tenant_id", ignoreDuplicates: true });
  if (insertError) throw new Error(insertError.message);

  const { data: winner } = await admin.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).single();
  if (!winner) throw new Error("billing customer mapping missing");
  if (winner.stripe_customer_id !== customer.id) {
    await stripe.customers.del(customer.id).catch(() => undefined);
  }
  return winner.stripe_customer_id;
}

export async function createCheckoutSessionAction(input: { planId: string; cycle: "monthly" | "yearly" }) {
  const { tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };
  if (input.cycle !== "monthly" && input.cycle !== "yearly") return { error: "Ciclo de cobrança inválido." };

  const admin = createServiceRoleClient();
  const [{ data: plan }, { data: current }] = await Promise.all([
    admin.from("plans").select("stripe_price_monthly_id, stripe_price_yearly_id").eq("id", input.planId).eq("active", true).maybeSingle(),
    admin.from("subscriptions").select("id").eq("tenant_id", tenantId).in("status", ["active", "trialing", "past_due"]).limit(1).maybeSingle(),
  ]);
  if (!plan) return { error: "Plano não encontrado." };
  // Trocar de plano com assinatura viva é no Customer Portal — um 2º
  // checkout criaria uma 2ª assinatura cobrando em paralelo.
  if (current) return { error: "Esta rede já tem uma assinatura ativa. Use \"Gerenciar assinatura\" para trocar de plano." };
  const priceId = input.cycle === "yearly" ? plan.stripe_price_yearly_id : plan.stripe_price_monthly_id;
  if (!priceId) return { error: "Este plano não tem preço configurado no Stripe." };

  try {
    const customerId = await ensureStripeCustomer(tenantId);
    const origin = await siteOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings/subscription?checkout=success`,
      cancel_url: `${origin}/settings/subscription?checkout=cancelled`,
      metadata: { tenant_id: tenantId, plan_id: input.planId },
      subscription_data: { metadata: { tenant_id: tenantId, plan_id: input.planId } },
    });
    return { url: session.url };
  } catch (err) {
    console.error("createCheckoutSessionAction", err);
    return { error: STRIPE_ERROR };
  }
}

export async function createPackCheckoutSessionAction(packId: string) {
  const { tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };

  const admin = createServiceRoleClient();
  const { data: pack } = await admin.from("credit_packs").select("*").eq("id", packId).eq("active", true).maybeSingle();
  if (!pack) return { error: "Pacote não encontrado." };
  if (!pack.stripe_price_id) return { error: "Este pacote não tem preço configurado no Stripe." };

  try {
    const customerId = await ensureStripeCustomer(tenantId);
    const origin = await siteOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/settings/credits?checkout=success`,
      cancel_url: `${origin}/settings/credits?checkout=cancelled`,
      metadata: { tenant_id: tenantId, pack_id: packId },
    });
    return { url: session.url };
  } catch (err) {
    console.error("createPackCheckoutSessionAction", err);
    return { error: STRIPE_ERROR };
  }
}

export async function createPortalSessionAction() {
  const { tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };

  const admin = createServiceRoleClient();
  const { data: billing } = await admin.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle();
  if (!billing) return { error: "Nenhuma assinatura encontrada para esta rede ainda." };

  try {
    const origin = await siteOrigin();
    const session = await getStripe().billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/settings/subscription`,
    });
    return { url: session.url };
  } catch (err) {
    console.error("createPortalSessionAction", err);
    return { error: STRIPE_ERROR };
  }
}
