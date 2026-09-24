import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// cache() dedupe a checagem is_platform_staff quando uma página admin chama
// 2+ funções deste arquivo na mesma requisição (ex.: admin/users/page.tsx).
export const requireStaff = cache(async () => {
  const supabase = await createClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) throw new Error("not authorized");
  return supabase;
});

export async function loadTenantsOverview() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, cnpj, plan_id, created_at, stores(id), products(count)")
    .order("created_at", { ascending: false });
  return (tenants ?? []).map((t) => {
    const products = t.products as unknown as { count: number }[];
    return { ...t, storeCount: t.stores?.length ?? 0, skuCount: products?.[0]?.count ?? 0 };
  });
}

export async function loadTenantDetail(tenantId: string) {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: tenant }, { data: stores }, { data: storeUsers }, { data: auditLog }, { count: skuCount }] = await Promise.all([
    admin.from("tenants").select("id, name, cnpj, plan_id, status, legal_name, segment, city, state, trial_ends_at, created_at").eq("id", tenantId).maybeSingle(),
    admin.from("stores").select("id, name, type").eq("tenant_id", tenantId).order("name"),
    admin.from("store_users").select("user_id, role, status, joined_at").eq("tenant_id", tenantId),
    admin.from("audit_log").select("id, kind, message, scope, created_at, created_by").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50),
    admin.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);
  if (!tenant) return null;

  const userIds = (storeUsers ?? []).map((u) => u.user_id);
  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    userIds.length ? admin.from("profiles").select("id, full_name, phone").in("id", userIds) : Promise.resolve({ data: [] }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || "Usuário"]));
  const phoneById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.phone || ""]));
  const emailById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email]));
  const owner = (storeUsers ?? []).find((u) => u.role === "proprietario");

  return {
    tenant,
    owner: owner ? { name: nameById[owner.user_id] || "", email: emailById[owner.user_id] || "", phone: phoneById[owner.user_id] || "" } : null,
    stores: stores ?? [],
    users: (storeUsers ?? []).map((u) => ({ ...u, name: nameById[u.user_id] || "Usuário", email: emailById[u.user_id] || "" })),
    auditLog: (auditLog ?? []).map((a) => ({ ...a, who: nameById[a.created_by ?? ""] || emailById[a.created_by ?? ""] || "—" })),
    skuCount: skuCount ?? 0,
  };
}

export async function loadPlatformStaff() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data: staff } = await admin.from("platform_staff").select("user_id, role, mfa_required, created_at").order("created_at");
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const userById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u]));

  return (staff ?? []).map((s) => {
    const u = userById[s.user_id];
    return { ...s, email: u?.email ?? "", lastSignInAt: u?.last_sign_in_at ?? null };
  });
}

export async function loadPlatformAuditLog() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: entries }, { data: authUsers }] = await Promise.all([
    admin
      .from("audit_log")
      .select("id, kind, message, target_type, target_id, created_by, created_at, tenant_id")
      .eq("scope", "platform")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email]));
  const tenantIds = [...new Set((entries ?? []).map((e) => e.tenant_id))];
  const { data: tenants } = tenantIds.length ? await admin.from("tenants").select("id, name").in("id", tenantIds) : { data: [] };
  const tenantNameById = Object.fromEntries((tenants ?? []).map((t) => [t.id, t.name]));

  return (entries ?? []).map((e) => ({ ...e, who: emailById[e.created_by ?? ""] || "—", tenantName: tenantNameById[e.tenant_id] || "—" }));
}

export async function loadSubscriptionsOverview() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: tenants }, { data: invoices }] = await Promise.all([
    admin
      .from("tenants")
      .select(`
        id, name, plan_id, status, trial_ends_at, created_at,
        plan:plans(name, monthly_price, yearly_price),
        subscriptions(id, cycle, status, current_period_end, cancel_at_period_end, created_at)
      `)
      .order("created_at", { ascending: false }),
    admin.from("invoices").select("tenant_id, amount_paid, status, created_at").eq("status", "paid"),
  ]);

  const ltvByTenant = new Map<string, number>();
  for (const inv of invoices ?? []) {
    ltvByTenant.set(inv.tenant_id, (ltvByTenant.get(inv.tenant_id) ?? 0) + Number(inv.amount_paid));
  }

  const rows = (tenants ?? []).map((t) => {
    const plan = t.plan as unknown as { name: string; monthly_price: number; yearly_price: number | null } | null;
    const subs = (t.subscriptions ?? []) as { id: string; cycle: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean }[];
    const sub = [...subs].sort((a, b) => (a.id < b.id ? 1 : -1))[0] ?? null;
    const value = sub ? (sub.cycle === "yearly" ? (plan?.yearly_price ?? 0) : (plan?.monthly_price ?? 0)) : 0;
    return {
      id: t.id, name: t.name, planName: plan?.name ?? t.plan_id,
      status: sub?.status ?? t.status, cycle: sub?.cycle ?? "—",
      value, nextCharge: sub?.current_period_end ?? null, cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      ltv: ltvByTenant.get(t.id) ?? 0,
    };
  });

  const active = rows.filter((r) => r.status === "active");
  const pastDue = rows.filter((r) => r.status === "past_due");
  const trialing = (tenants ?? []).filter((t) => t.trial_ends_at && new Date(t.trial_ends_at) < new Date());
  const converted = trialing.filter((t) => t.status !== "trial");

  const mrr = active.reduce((s, r) => s + (r.cycle === "yearly" ? r.value / 12 : r.value), 0);

  return {
    rows,
    kpis: {
      mrr,
      arr: mrr * 12,
      avgTicket: active.length ? mrr / active.length : 0,
      pastDueTotal: pastDue.reduce((s, r) => s + r.value, 0),
      pastDueCount: pastDue.length,
      trialConversionPct: trialing.length ? Math.round((converted.length / trialing.length) * 100) : null,
    },
  };
}

export async function loadSubscriptionDetail(tenantId: string) {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: tenant }, { data: invoices }, { data: auditLog }] = await Promise.all([
    admin
      .from("tenants")
      .select("id, name, plan_id, status, created_at, plan:plans(name, monthly_price, yearly_price), subscriptions(stripe_subscription_id, cycle, status, current_period_end, cancel_at_period_end), billing_customers(stripe_customer_id)")
      .eq("id", tenantId)
      .maybeSingle(),
    admin.from("invoices").select("id, amount_paid, status, hosted_invoice_url, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(20),
    admin.from("audit_log").select("id, kind, message, created_at").eq("tenant_id", tenantId).eq("scope", "platform").order("created_at", { ascending: false }).limit(20),
  ]);
  if (!tenant) return null;

  // billing_customers é 1:1 (tenant_id é a PK de lá) mas o PostgREST às
  // vezes infere o embed como coleção mesmo assim — normaliza pra objeto
  // único em vez de confiar no formato bruto (mesmo quirk já visto em
  // products/queries.ts nesta sessão).
  const rawBillingCustomer = (tenant as unknown as { billing_customers: unknown }).billing_customers;
  const billingCustomer = Array.isArray(rawBillingCustomer) ? rawBillingCustomer[0] : rawBillingCustomer;

  return {
    tenant: { ...tenant, billing_customers: billingCustomer ? [billingCustomer] : [] },
    invoices: invoices ?? [],
    events: auditLog ?? [],
  };
}

export async function loadAiMonitoring() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: usage }, { data: ops }] = await Promise.all([
    admin
      .from("ai_usage_log")
      .select("op_id, model, tokens_in, tokens_out, cost_usd, latency_ms, status, created_at, tenant_id")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("ai_ops").select("id, label"),
  ]);
  const opLabel = Object.fromEntries((ops ?? []).map((o) => [o.id, o.label]));

  const tenantIds = [...new Set((usage ?? []).slice(0, 50).map((u) => u.tenant_id))];
  const { data: tenants } = tenantIds.length ? await admin.from("tenants").select("id, name").in("id", tenantIds) : { data: [] };
  const tenantName = Object.fromEntries((tenants ?? []).map((t) => [t.id, t.name]));

  const byDay = new Map<string, { cost: number; requests: number; tokens: number }>();
  const byModelOp = new Map<string, { model: string; op: string; cost: number; tokens: number; requests: number; latencySum: number; latencyCount: number }>();
  let totalCost = 0, totalTokens = 0, totalRequests = 0, latencySum = 0, latencyCount = 0;

  for (const row of usage ?? []) {
    const day = row.created_at.slice(0, 10);
    const cost = Number(row.cost_usd ?? 0);
    const tokens = (row.tokens_in ?? 0) + (row.tokens_out ?? 0);
    const dayBucket = byDay.get(day) ?? { cost: 0, requests: 0, tokens: 0 };
    dayBucket.cost += cost; dayBucket.requests += 1; dayBucket.tokens += tokens;
    byDay.set(day, dayBucket);

    const key = `${row.model}::${row.op_id}`;
    const bucket = byModelOp.get(key) ?? { model: row.model, op: opLabel[row.op_id] ?? row.op_id, cost: 0, tokens: 0, requests: 0, latencySum: 0, latencyCount: 0 };
    bucket.cost += cost; bucket.tokens += tokens; bucket.requests += 1;
    if (row.latency_ms != null) { bucket.latencySum += row.latency_ms; bucket.latencyCount += 1; }
    byModelOp.set(key, bucket);

    totalCost += cost; totalTokens += tokens; totalRequests += 1;
    if (row.latency_ms != null) { latencySum += row.latency_ms; latencyCount += 1; }
  }

  return {
    kpis: {
      totalCost, totalTokens, totalRequests,
      avgLatencyMs: latencyCount ? Math.round(latencySum / latencyCount) : null,
    },
    byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
    byModelOp: [...byModelOp.values()]
      .map((b) => ({ ...b, avgLatencyMs: b.latencyCount ? Math.round(b.latencySum / b.latencyCount) : null }))
      .sort((a, b) => b.cost - a.cost),
    recentLogs: (usage ?? []).slice(0, 50).map((u) => ({
      ...u, opLabel: opLabel[u.op_id] ?? u.op_id, tenantName: tenantName[u.tenant_id] ?? "—",
    })),
  };
}

export async function loadPlatformReports() {
  const supabase = await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: cohorts }, { data: growth }, { data: tenants }, { data: plans }, { data: products }, { data: movements }, { data: storeUsers }] = await Promise.all([
    supabase.rpc("fn_platform_cohort_retention"),
    supabase.rpc("fn_platform_growth_by_month", { p_months: 12 }),
    admin.from("tenants").select("id, plan_id"),
    admin.from("plans").select("id, name, limits"),
    admin.from("products").select("id, tenant_id"),
    admin.from("stock_movements").select("id, tenant_id").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from("store_users").select("user_id, tenant_id"),
  ]);

  const planIdByTenant = Object.fromEntries((tenants ?? []).map((t) => [t.id, t.plan_id]));
  const countByPlan = (rows: { tenant_id: string }[]) => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const planId = planIdByTenant[r.tenant_id];
      if (planId) out[planId] = (out[planId] ?? 0) + 1;
    }
    return out;
  };
  const skusByPlan = countByPlan(products ?? []);
  const movesByPlan = countByPlan(movements ?? []);
  const usersByPlan = countByPlan(storeUsers ?? []);
  const tenantCountByPlan = (tenants ?? []).reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.plan_id]: (acc[t.plan_id] ?? 0) + 1 }), {});

  const skusByTenant: Record<string, number> = {};
  for (const row of products ?? []) skusByTenant[row.tenant_id] = (skusByTenant[row.tenant_id] ?? 0) + 1;

  const usageByPlan = (plans ?? []).map((p) => {
    const tenantCount = tenantCountByPlan[p.id] ?? 0;
    const limits = p.limits as { skus?: number } | null;
    const avgSkus = tenantCount ? Math.round((skusByPlan[p.id] ?? 0) / tenantCount) : 0;
    const nearLimitCount = limits?.skus
      ? (tenants ?? []).filter((t) => t.plan_id === p.id && (skusByTenant[t.id] ?? 0) / limits.skus! >= 0.8).length
      : 0;
    return {
      planId: p.id, planName: p.name, tenantCount,
      avgSkus, skuLimit: limits?.skus ?? null,
      avgUsers: tenantCount ? +((usersByPlan[p.id] ?? 0) / tenantCount).toFixed(1) : 0,
      movements30d: movesByPlan[p.id] ?? 0,
      nearLimitCount,
    };
  });

  return { cohorts: cohorts ?? [], growth: growth ?? [], usageByPlan };
}

export async function loadAdminOverview() {
  const supabase = await requireStaff();
  const admin = createServiceRoleClient();
  const [{ data: mrrTrend }, { data: recentSignups }, { data: activeSubs }, { data: allTenants }, { data: plans }] = await Promise.all([
    supabase.rpc("fn_platform_mrr_trend", { p_months: 12 }),
    admin.from("tenants").select("id, name, plan_id, segment, city, status, created_at").order("created_at", { ascending: false }).limit(6),
    admin.from("subscriptions").select("tenant_id, cycle, plan:plans(monthly_price, yearly_price)").eq("status", "active"),
    admin.from("tenants").select("plan_id"),
    admin.from("plans").select("id, name"),
  ]);

  const currentMrr = (activeSubs ?? []).reduce((s, sub) => {
    const plan = sub.plan as unknown as { monthly_price: number; yearly_price: number | null } | null;
    const value = sub.cycle === "yearly" ? (plan?.yearly_price ?? 0) / 12 : (plan?.monthly_price ?? 0);
    return s + value;
  }, 0);

  const planName = Object.fromEntries((plans ?? []).map((p) => [p.id, p.name]));
  const countByPlanId = (allTenants ?? []).reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.plan_id]: (acc[t.plan_id] ?? 0) + 1 }), {});
  const planDistribution = Object.entries(countByPlanId).map(([planId, count]) => ({ planId, planName: planName[planId] ?? planId, count }));

  return {
    currentMrr,
    mrrTrend: mrrTrend ?? [],
    planDistribution,
    tenantCount: allTenants?.length ?? 0,
    recentSignups: (recentSignups ?? []).map((t) => ({ ...t, planName: planName[t.plan_id] ?? t.plan_id })),
  };
}

export async function loadPlatformSettings() {
  const supabase = await requireStaff();
  const admin = createServiceRoleClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [{ data: settings }, { data: usage }] = await Promise.all([
    supabase.from("platform_settings").select("trial_days, ai_spend_ceiling_usd, ai_alert_pct, updated_at").maybeSingle(),
    admin.from("ai_usage_log").select("cost_usd").gte("created_at", monthStart.toISOString()),
  ]);

  const monthSpend = (usage ?? []).reduce((s, u) => s + Number(u.cost_usd ?? 0), 0);
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const projection = (monthSpend / now.getUTCDate()) * daysInMonth;

  // Só o modo e a presença da chave — nunca o valor.
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const integrations = [
    {
      name: "Stripe", desc: "Cobrança, assinaturas e crédito avulso",
      connected: Boolean(stripeKey), ref: stripeKey ? (stripeKey.startsWith("sk_live") ? "modo produção" : "modo teste") : "—",
    },
    {
      name: "Anthropic", desc: "Classificação de produtos, OCR de notas, previsão de demanda",
      connected: Boolean(process.env.ANTHROPIC_API_KEY), ref: process.env.ANTHROPIC_API_KEY ? "chave configurada" : "—",
    },
    {
      name: "Supabase Auth", desc: "Emails transacionais (convite, confirmação, senha)",
      connected: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), ref: "SMTP do projeto",
    },
  ];

  return {
    settings: {
      trialDays: settings?.trial_days ?? 14,
      aiSpendCeilingUsd: Number(settings?.ai_spend_ceiling_usd ?? 2500),
      aiAlertPct: settings?.ai_alert_pct ?? 80,
      updatedAt: settings?.updated_at ?? null,
    },
    aiMonth: { spend: monthSpend, projection },
    integrations,
  };
}

export async function loadPlans() {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data } = await admin.from("plans").select("*").order("monthly_price");
  return data ?? [];
}

export async function loadPlan(id: string) {
  await requireStaff();
  const admin = createServiceRoleClient();
  const { data } = await admin.from("plans").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
