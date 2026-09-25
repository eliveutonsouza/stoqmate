import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { getStripe } from "@/lib/stripe";

// Leituras das telas de cobrança. Banco (espelho do Stripe gravado pelo
// webhook) é a fonte do que existe; o Stripe só é consultado ao vivo para o
// que o espelho não guarda (itens da fatura, valor em aberto, cartão). Falha
// do Stripe nunca derruba a tela: vira `stripeError` e a UI explica.

export type BillingCycle = "monthly" | "yearly";

type PlanRow = {
  id: string; name: string; tagline: string | null; who: string | null;
  monthly_price: number | string; yearly_price: number | string | null;
  credits: number; popular: boolean;
};

export type PlanView = {
  id: string; name: string; tagline: string | null; who: string | null;
  monthly: number; yearly: number | null; credits: number; popular: boolean;
};

type SubscriptionRow = {
  stripe_subscription_id: string; plan_id: string | null; cycle: string; status: string;
  current_period_end: string | null; cancel_at_period_end: boolean; updated_at: string;
};

export type SubscriptionView = {
  planId: string | null; cycle: BillingCycle; status: string;
  currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
};

const PLAN_COLUMNS = "id, name, tagline, who, monthly_price, yearly_price, credits, popular";
const SUB_COLUMNS = "stripe_subscription_id, plan_id, cycle, status, current_period_end, cancel_at_period_end, updated_at";
// Mesma lista que createCheckoutSessionAction trata como "já assina" (+ unpaid,
// que ainda existe no Stripe e bloquearia um 2º checkout de fato).
const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);
const STRIPE_READ_ERROR = "Não foi possível consultar o provedor de pagamento agora. Os demais dados desta tela são do nosso registro.";

function toPlanView(r: PlanRow): PlanView {
  return {
    id: r.id, name: r.name, tagline: r.tagline, who: r.who,
    monthly: Number(r.monthly_price),
    yearly: r.yearly_price != null ? Number(r.yearly_price) : null,
    credits: r.credits, popular: r.popular,
  };
}

function toSubscriptionView(s: SubscriptionRow): SubscriptionView {
  return {
    planId: s.plan_id, cycle: s.cycle === "yearly" ? "yearly" : "monthly", status: s.status,
    currentPeriodEnd: s.current_period_end, cancelAtPeriodEnd: s.cancel_at_period_end,
  };
}

const fromUnix = (ts: number | null | undefined) => (ts ? new Date(ts * 1000).toISOString() : null);
const cents = (n: number | null | undefined) => (n ?? 0) / 100;

async function hasAccess(supabase: SupabaseClient, area: string, level: number) {
  return Boolean(must(await supabase.rpc("has_access", { p_area: area, p_min_level: level }), `billing.has_access.${area}`));
}

async function loadActivePlans(supabase: SupabaseClient) {
  const rows = must(await supabase.from("plans").select(PLAN_COLUMNS).eq("active", true).order("monthly_price"), "billing.plans") as PlanRow[];
  return rows.map(toPlanView);
}

// Tenant + assinaturas + planos + permissão de mexer na cobrança, numa volta.
async function subscriptionContext() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const [plans, tenantRes, subsRes, canManage] = await Promise.all([
    loadActivePlans(supabase),
    supabase.from("tenants").select("name, cnpj, plan_id, status, trial_ends_at, canceled_at, created_at").eq("id", tenantId).single(),
    supabase.from("subscriptions").select(SUB_COLUMNS).eq("tenant_id", tenantId).order("updated_at", { ascending: false }).limit(10),
    hasAccess(supabase, "billing", 2),
  ]);
  const tenant = must(tenantRes, "billing.tenant") as {
    name: string; cnpj: string | null; plan_id: string; status: string;
    trial_ends_at: string | null; canceled_at: string | null; created_at: string;
  };
  const subs = must(subsRes, "billing.subscriptions") as SubscriptionRow[];
  const live = subs.find((s) => LIVE_STATUSES.has(s.status)) ?? null;
  return { supabase, tenantId, plans, tenant, live, latest: subs[0] ?? null, canManage };
}

// Contagens reais do que a rede cadastrou/vendeu desde `since`. Cada número
// só aparece se o perfil pode ver aquela área — RLS devolveria 0 em silêncio
// para quem não pode, e 0 aqui seria mentira.
async function tenantUsage(supabase: SupabaseClient, tenantId: string, since: string) {
  const [canCatalog, canPos, productsRes, storesRes, reportRes] = await Promise.all([
    hasAccess(supabase, "catalog", 1),
    hasAccess(supabase, "pos", 1),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.rpc("fn_sales_report", { p_start: since, p_end: new Date().toISOString() }),
  ]);
  if (productsRes.error) throw new Error(`[billing.usage.products] ${productsRes.error.message}`);
  if (storesRes.error) throw new Error(`[billing.usage.stores] ${storesRes.error.message}`);
  const report = must(reportRes, "billing.usage.sales") as { sale_count?: number; revenue?: number } | null;
  return {
    products: canCatalog ? productsRes.count ?? 0 : null,
    stores: storesRes.count ?? 0,
    sales: canPos ? Number(report?.sale_count ?? 0) : null,
    revenue: canPos ? Number(report?.revenue ?? 0) : null,
  };
}

export async function loadBillingState() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const [subscription, invoices, plans, tenant] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("invoices").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(12),
    supabase.from("plans").select("*").eq("active", true).order("monthly_price"),
    supabase.from("tenants").select("plan_id").eq("id", tenantId).maybeSingle(),
  ]).then(([s, i, p, t]) => [
    must(s, "billing.state.subscription"),
    must(i, "billing.state.invoices"),
    must(p, "billing.state.plans"),
    must(t, "billing.state.tenant"),
  ] as const);

  return {
    subscription: subscription ?? null,
    invoices: invoices ?? [],
    plans: plans ?? [],
    currentPlanId: subscription?.plan_id ?? tenant?.plan_id ?? "balcao",
  };
}

// /settings/subscription/{change,annual,cancel}
export async function loadSubscriptionOverview() {
  const { plans, tenant, live, canManage } = await subscriptionContext();
  return {
    plans,
    currentPlanId: live?.plan_id ?? tenant.plan_id,
    subscription: live ? toSubscriptionView(live) : null,
    canManage,
  };
}

// /settings/subscription/invoice?id=
export async function loadInvoiceDetail(id: string | undefined) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return { invoice: null };
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  const [rowRes, tenantRes] = await Promise.all([
    supabase.from("invoices").select("id, stripe_invoice_id, amount_paid, currency, status, hosted_invoice_url, invoice_pdf, period_end, created_at").eq("id", id).eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("tenants").select("name, cnpj").eq("id", tenantId).single(),
  ]);
  const row = must(rowRes, "billing.invoice") as {
    id: string; stripe_invoice_id: string; amount_paid: number | string; currency: string; status: string;
    hosted_invoice_url: string | null; invoice_pdf: string | null; period_end: string | null; created_at: string;
  } | null;
  if (!row) return { invoice: null };
  const tenant = must(tenantRes, "billing.invoice.tenant") as { name: string; cnpj: string | null };

  let stripe: {
    number: string | null; status: string | null; subtotal: number; discount: number; total: number;
    amountPaid: number; amountRemaining: number; paidAt: string | null; dueDate: string | null;
    periodStart: string | null; periodEnd: string | null;
    customerName: string | null; customerEmail: string | null; taxIds: string[];
    hostedUrl: string | null; pdfUrl: string | null;
    lines: { id: string; description: string; quantity: number; amount: number; start: string | null; end: string | null }[];
    moreLines: boolean;
  } | null = null;
  let stripeError: string | null = null;
  try {
    const inv = await getStripe().invoices.retrieve(row.stripe_invoice_id);
    stripe = {
      number: inv.number,
      status: inv.status,
      subtotal: cents(inv.subtotal),
      discount: cents((inv.total_discount_amounts ?? []).reduce((s, d) => s + d.amount, 0)),
      total: cents(inv.total),
      amountPaid: cents(inv.amount_paid),
      amountRemaining: cents(inv.amount_remaining),
      paidAt: fromUnix(inv.status_transitions?.paid_at),
      dueDate: fromUnix(inv.due_date),
      periodStart: fromUnix(inv.period_start),
      periodEnd: fromUnix(inv.period_end),
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      taxIds: (inv.customer_tax_ids ?? []).map((t) => t.value).filter((v): v is string => Boolean(v)),
      hostedUrl: inv.hosted_invoice_url ?? null,
      pdfUrl: inv.invoice_pdf ?? null,
      lines: inv.lines.data.map((l) => ({
        id: l.id,
        description: l.description ?? "Item da fatura",
        quantity: l.quantity ?? 1,
        amount: cents(l.amount),
        start: fromUnix(l.period?.start),
        end: fromUnix(l.period?.end),
      })),
      moreLines: inv.lines.has_more,
    };
  } catch (err) {
    console.error("loadInvoiceDetail stripe", err);
    stripeError = STRIPE_READ_ERROR;
  }

  return {
    invoice: {
      id: row.id,
      status: stripe?.status ?? row.status,
      amountPaid: Number(row.amount_paid),
      createdAt: row.created_at,
      periodEnd: row.period_end,
      hostedUrl: stripe?.hostedUrl ?? row.hosted_invoice_url,
      pdfUrl: stripe?.pdfUrl ?? row.invoice_pdf,
      tenantName: tenant.name,
      tenantCnpj: tenant.cnpj,
    },
    stripe,
    stripeError,
  };
}

type CardView = { brand: string; last4: string; expMonth: number; expYear: number };

function cardFrom(pm: unknown): CardView | null {
  const card = (pm && typeof pm === "object" && "card" in pm ? (pm as { card?: { brand?: string; display_brand?: string | null; last4?: string; exp_month?: number; exp_year?: number } | null }).card : null);
  if (!card?.last4) return null;
  return { brand: card.display_brand ?? card.brand ?? "cartão", last4: card.last4, expMonth: card.exp_month ?? 0, expYear: card.exp_year ?? 0 };
}

// /billing/past-due
export async function loadPastDueState() {
  const { supabase, tenantId, plans, live, canManage } = await subscriptionContext();
  const [ctxRes, openRes, customerRes] = await Promise.all([
    supabase.rpc("fn_session_context"),
    supabase.from("invoices").select("id, stripe_invoice_id, amount_paid, status, created_at, hosted_invoice_url").eq("tenant_id", tenantId).in("status", ["open", "uncollectible"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("billing_customers").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const ctx = (must(ctxRes, "billing.pastdue.session") as { access: string }[] | null)?.[0];
  const openInvoice = must(openRes, "billing.pastdue.invoice") as { id: string; stripe_invoice_id: string; status: string; created_at: string; hosted_invoice_url: string | null } | null;
  const customer = must(customerRes, "billing.pastdue.customer") as { stripe_customer_id: string } | null;

  let invoice: { id: string; amountDue: number; createdAt: string; dueDate: string | null; nextAttempt: string | null; attempts: number; hostedUrl: string | null } | null = null;
  let card: CardView | null = null;
  let stripeError: string | null = null;
  try {
    const stripe = getStripe();
    const [inv, sub, cust] = await Promise.all([
      openInvoice ? stripe.invoices.retrieve(openInvoice.stripe_invoice_id) : null,
      live ? stripe.subscriptions.retrieve(live.stripe_subscription_id, { expand: ["default_payment_method"] }) : null,
      customer ? stripe.customers.retrieve(customer.stripe_customer_id, { expand: ["invoice_settings.default_payment_method"] }) : null,
    ]);
    if (openInvoice && inv) {
      invoice = {
        id: openInvoice.id,
        amountDue: cents(inv.amount_remaining),
        createdAt: fromUnix(inv.created) ?? openInvoice.created_at,
        dueDate: fromUnix(inv.due_date),
        nextAttempt: fromUnix(inv.next_payment_attempt),
        attempts: inv.attempt_count,
        hostedUrl: inv.hosted_invoice_url ?? openInvoice.hosted_invoice_url,
      };
    }
    const custPm = cust && !("deleted" in cust && cust.deleted) ? cust.invoice_settings?.default_payment_method : null;
    card = cardFrom(sub?.default_payment_method) ?? cardFrom(custPm);
  } catch (err) {
    console.error("loadPastDueState stripe", err);
    stripeError = STRIPE_READ_ERROR;
    if (openInvoice) {
      invoice = { id: openInvoice.id, amountDue: 0, createdAt: openInvoice.created_at, dueDate: null, nextAttempt: null, attempts: 0, hostedUrl: openInvoice.hosted_invoice_url };
    }
  }

  const plan = plans.find((p) => p.id === live?.plan_id) ?? null;
  return {
    access: ctx?.access ?? "ok",
    subscription: live ? toSubscriptionView(live) : null,
    planName: plan?.name ?? null,
    invoice,
    card,
    hasCustomer: Boolean(customer),
    stripeError,
    canManage,
  };
}

// /account/cancelled
export async function loadAccountCancelledState() {
  const { supabase, tenantId, plans, tenant, live, latest, canManage } = await subscriptionContext();
  const usage = await tenantUsage(supabase, tenantId, tenant.created_at);

  // Cancelamento pelo proprietário grava tenants.canceled_at; cancelamento
  // vindo do Stripe (fim do período, falta de pagamento) só existe lá.
  let canceledAt = tenant.canceled_at;
  let stripeError: string | null = null;
  if (!canceledAt && latest?.status === "canceled") {
    try {
      const sub = await getStripe().subscriptions.retrieve(latest.stripe_subscription_id);
      canceledAt = fromUnix(sub.ended_at ?? sub.canceled_at);
    } catch (err) {
      console.error("loadAccountCancelledState stripe", err);
      stripeError = STRIPE_READ_ERROR;
    }
  }

  return {
    tenantName: tenant.name,
    tenantStatus: tenant.status,
    canceledAt,
    hasLiveSubscription: Boolean(live),
    previousPlanId: latest?.plan_id ?? tenant.plan_id,
    plans,
    usage,
    stripeError,
    canManage,
  };
}

// /trial-ended — rota aberta: pode chegar sem sessão ou com qualquer perfil.
export async function loadTrialEndedState() {
  const supabase = await createClient();
  const [{ data: userData }, plans] = await Promise.all([supabase.auth.getUser(), loadActivePlans(supabase)]);
  if (!userData.user) return { signedIn: false as const, plans };

  const tenantId = must(await supabase.rpc("auth_tenant_id"), "billing.trial.tenant_id") as string | null;
  if (!tenantId) return { signedIn: true as const, hasTenant: false as const, plans };

  const [tenantRes, canManage, subsRes] = await Promise.all([
    supabase.from("tenants").select("name, created_at, trial_ends_at").eq("id", tenantId).single(),
    hasAccess(supabase, "billing", 2),
    supabase.from("subscriptions").select("status").eq("tenant_id", tenantId),
  ]);
  const tenant = must(tenantRes, "billing.trial.tenant") as { name: string; created_at: string; trial_ends_at: string | null };
  const subs = must(subsRes, "billing.trial.subscriptions") as { status: string }[];
  const usage = await tenantUsage(supabase, tenantId, tenant.created_at);

  return {
    signedIn: true as const,
    hasTenant: true as const,
    plans,
    tenantName: tenant.name,
    createdAt: tenant.created_at,
    trialEndsAt: tenant.trial_ends_at,
    trialEnded: tenant.trial_ends_at != null && new Date(tenant.trial_ends_at).getTime() < Date.now(),
    hasLiveSubscription: subs.some((s) => LIVE_STATUSES.has(s.status)),
    usage,
    canManage,
  };
}

// /checkout?plan=&cycle= — ponte pro Stripe Checkout. Rota aberta.
export async function loadCheckoutState(params: { plan?: string; cycle?: string }) {
  const supabase = await createClient();
  const [{ data: userData }, plans] = await Promise.all([supabase.auth.getUser(), loadActivePlans(supabase)]);
  const requested = plans.find((p) => p.id === params.plan);
  const selectedPlanId = (requested ?? plans.find((p) => p.popular) ?? plans[0])?.id ?? null;
  const cycle: BillingCycle = params.cycle === "yearly" ? "yearly" : "monthly";
  const base = { plans, selectedPlanId, cycle, invalidPlan: Boolean(params.plan && !requested) };

  if (!userData.user) return { ...base, signedIn: false as const };
  const tenantId = must(await supabase.rpc("auth_tenant_id"), "billing.checkout.tenant_id") as string | null;
  if (!tenantId) return { ...base, signedIn: true as const, hasTenant: false as const };

  const [canManage, subsRes] = await Promise.all([
    hasAccess(supabase, "billing", 2),
    supabase.from("subscriptions").select("status").eq("tenant_id", tenantId),
  ]);
  const subs = must(subsRes, "billing.checkout.subscriptions") as { status: string }[];
  return {
    ...base,
    signedIn: true as const,
    hasTenant: true as const,
    canManage,
    hasLiveSubscription: subs.some((s) => LIVE_STATUSES.has(s.status)),
  };
}
