"use server";

import { headers } from "next/headers";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStripe } from "@/lib/stripe";

async function requireBillingAccess() {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_access", { p_area: "billing", p_min_level: 2 });
  if (!allowed) return { supabase: null, error: "Seu perfil não tem permissão para gerenciar a assinatura." };
  return { supabase, error: null };
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = host?.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

async function ensureStripeCustomer(tenantId: string) {
  const admin = createServiceRoleClient();
  const { data: existing } = await admin.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle();
  if (existing) return existing.stripe_customer_id;

  const { data: tenant } = await admin.from("tenants").select("name").eq("id", tenantId).maybeSingle();
  const { data: ownerProfile } = await admin.from("profiles").select("id").eq("tenant_id", tenantId).limit(1).maybeSingle();
  const { data: ownerUser } = ownerProfile ? await admin.auth.admin.getUserById(ownerProfile.id) : { data: null };

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant?.name ?? "Rede Stoqmate",
    email: ownerUser?.user?.email ?? undefined,
    metadata: { tenant_id: tenantId },
  });

  await admin.from("billing_customers").insert({ tenant_id: tenantId, stripe_customer_id: customer.id });
  return customer.id;
}

export async function createCheckoutSessionAction(input: { planId: string; cycle: "monthly" | "yearly" }) {
  const { supabase, error } = await requireBillingAccess();
  if (!supabase) return { error };
  const tenantId = await getTenantId(supabase);

  const admin = createServiceRoleClient();
  const { data: plan } = await admin.from("plans").select("*").eq("id", input.planId).maybeSingle();
  if (!plan) return { error: "Plano não encontrado." };
  const priceId = input.cycle === "yearly" ? plan.stripe_price_yearly_id : plan.stripe_price_monthly_id;
  if (!priceId) return { error: "Este plano não tem preço configurado no Stripe." };

  const customerId = await ensureStripeCustomer(tenantId);
  const origin = await siteOrigin();

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/subscription?checkout=success`,
    cancel_url: `${origin}/settings/subscription?checkout=cancelled`,
    metadata: { tenant_id: tenantId, plan_id: input.planId },
    subscription_data: { metadata: { tenant_id: tenantId, plan_id: input.planId } },
  });

  return { url: session.url };
}

export async function createPortalSessionAction() {
  const { supabase, error } = await requireBillingAccess();
  if (!supabase) return { error };
  const tenantId = await getTenantId(supabase);

  const admin = createServiceRoleClient();
  const { data: billing } = await admin.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle();
  if (!billing) return { error: "Nenhuma assinatura encontrada para esta rede ainda." };

  const origin = await siteOrigin();
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${origin}/settings/subscription`,
  });

  return { url: session.url };
}
