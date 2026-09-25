"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
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

type PortalFlow = Stripe.BillingPortal.SessionCreateParams.FlowData;

type LiveSubscription = { stripe_subscription_id: string; plan_id: string | null; cycle: string; status: string; cancel_at_period_end: boolean };

// Assinatura viva + customer do Stripe, lidos com o client da sessão (RLS de
// billing já cobre quem passou por requireBillingAccess).
async function liveBilling(supabase: SupabaseClient, tenantId: string) {
  const [subRes, customerRes] = await Promise.all([
    supabase.from("subscriptions")
      .select("stripe_subscription_id, plan_id, cycle, status, cancel_at_period_end")
      .eq("tenant_id", tenantId)
      .in("status", ["active", "trialing", "past_due", "unpaid"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  if (subRes.error || customerRes.error) return { error: "Não foi possível ler a assinatura agora. Tente de novo em instantes." } as const;
  return {
    error: null,
    subscription: subRes.data as LiveSubscription | null,
    customerId: (customerRes.data?.stripe_customer_id as string | undefined) ?? null,
  } as const;
}

async function portalUrl(customer: string, flow?: PortalFlow) {
  const origin = await siteOrigin();
  const returnUrl = `${origin}/settings/subscription`;
  const session = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: returnUrl,
    ...(flow ? { flow_data: { ...flow, after_completion: { type: "redirect", redirect: { return_url: returnUrl } } } } : {}),
  });
  return session.url;
}

// Troca de plano/ciclo. Sem assinatura viva → Checkout novo. Com assinatura →
// Customer Portal já com o preço escolhido pré-selecionado
// (subscription_update_confirm); se a configuração do Portal não aceitar esse
// preço, cai no fluxo subscription_update, onde o cliente escolhe lá dentro.
export async function changePlanAction(input: { planId: string; cycle: "monthly" | "yearly" }) {
  const { supabase, tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };
  if (input.cycle !== "monthly" && input.cycle !== "yearly") return { error: "Ciclo de cobrança inválido." };

  const billing = await liveBilling(supabase, tenantId);
  if (billing.error) return { error: billing.error };
  if (!billing.subscription) return createCheckoutSessionAction(input);

  const sub = billing.subscription;
  if (sub.plan_id === input.planId && sub.cycle === input.cycle) return { error: "Este já é o seu plano e ciclo atuais." };
  if (sub.status === "past_due" || sub.status === "unpaid") return { error: "Há um pagamento pendente. Regularize a cobrança antes de trocar de plano." };
  if (!billing.customerId) return { error: "Nenhum cliente de cobrança encontrado para esta rede." };

  const { data: plan, error: planError } = await supabase.from("plans")
    .select("stripe_price_monthly_id, stripe_price_yearly_id").eq("id", input.planId).eq("active", true).maybeSingle();
  if (planError) return { error: "Não foi possível ler o plano agora. Tente de novo em instantes." };
  if (!plan) return { error: "Plano não encontrado." };
  const priceId = input.cycle === "yearly" ? plan.stripe_price_yearly_id : plan.stripe_price_monthly_id;
  if (!priceId) return { error: "Este plano não tem preço configurado no Stripe." };

  try {
    const stripeSub = await getStripe().subscriptions.retrieve(sub.stripe_subscription_id);
    const item = stripeSub.items.data[0];
    if (!item) return { error: "A assinatura no Stripe não tem item para atualizar." };
    try {
      const url = await portalUrl(billing.customerId, {
        type: "subscription_update_confirm",
        subscription_update_confirm: { subscription: stripeSub.id, items: [{ id: item.id, price: priceId, quantity: item.quantity ?? 1 }] },
      });
      return { url };
    } catch (confirmErr) {
      console.error("changePlanAction subscription_update_confirm", confirmErr);
      const url = await portalUrl(billing.customerId, { type: "subscription_update", subscription_update: { subscription: stripeSub.id } });
      return { url };
    }
  } catch (err) {
    console.error("changePlanAction", err);
    return { error: STRIPE_ERROR };
  }
}

export async function cancelSubscriptionAction() {
  const { supabase, tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };

  const billing = await liveBilling(supabase, tenantId);
  if (billing.error) return { error: billing.error };
  if (!billing.subscription || !billing.customerId) return { error: "Não há assinatura ativa para cancelar." };
  if (billing.subscription.cancel_at_period_end) return { error: "O cancelamento já está agendado para o fim do período atual." };

  try {
    const url = await portalUrl(billing.customerId, {
      type: "subscription_cancel",
      subscription_cancel: { subscription: billing.subscription.stripe_subscription_id },
    });
    return { url };
  } catch (err) {
    console.error("cancelSubscriptionAction", err);
    return { error: STRIPE_ERROR };
  }
}

// Atualizar cartão: fluxo direto de payment_method_update; se o Portal não
// tiver esse recurso ligado, abre a home do Portal (lá também troca cartão).
export async function updatePaymentMethodAction() {
  const { supabase, tenantId, error } = await requireBillingAccess();
  if (!tenantId) return { error };

  const billing = await liveBilling(supabase, tenantId);
  if (billing.error) return { error: billing.error };
  if (!billing.customerId) return { error: "Nenhum cliente de cobrança encontrado para esta rede." };

  try {
    try {
      return { url: await portalUrl(billing.customerId, { type: "payment_method_update" }) };
    } catch (flowErr) {
      console.error("updatePaymentMethodAction payment_method_update", flowErr);
      return { url: await portalUrl(billing.customerId) };
    }
  } catch (err) {
    console.error("updatePaymentMethodAction", err);
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
