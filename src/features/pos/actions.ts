"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";
import { isEmail, isUuid } from "@/lib/validation";
import { userMessage, type DbErrorLike } from "@/lib/errors";
import { scheduleNotificationEmails } from "@/features/network-admin/notification-emails";

function friendlyError(error: DbErrorLike) {
  const message = error?.message ?? "";
  const known: Record<string, string> = {
    "not authorized": "Seu perfil não tem permissão para essa operação.",
    "já existe um caixa aberto nesta unidade": "Já existe um caixa aberto nesta unidade.",
    "sessão de caixa não encontrada ou já fechada": "Sessão de caixa não encontrada ou já fechada.",
    "informe ao menos um item": "Adicione pelo menos um item ao carrinho.",
  };
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  if (message.includes("saldo insuficiente")) return "Saldo insuficiente para um dos itens do carrinho.";
  if (message.includes("detalhe a divergência")) return "Há diferença no caixa — detalhe em pelo menos 10 caracteres.";
  if (message.includes("exige aprovação do gestor")) return "Desconto acima de 20% precisa da aprovação de um gestor.";
  if (message.includes("aprovação de desconto inválida")) return "A aprovação do gestor expirou ou já foi usada. Peça de novo.";
  if (message.includes("maior que o aprovado")) return "O desconto passou do limite que o gestor aprovou. Peça uma nova aprovação.";
  if (message.includes("cliente inválido")) return "Cliente inválido.";
  return userMessage(error, "pos/actions");
}

export async function confirmSaleAction(input: {
  storeId: string;
  customerId: string | null;
  paymentMethod: string;
  installments: number;
  cashSessionId: string | null;
  notes: string;
  items: { productId: string; qty: number; unitPrice: number; discountPct: number }[];
  orderDiscountAmount: number;
  discountApprovalId?: string | null;
}) {
  if (input.customerId && !isUuid(input.customerId)) return { error: "Cliente inválido." };
  if (input.discountApprovalId && !isUuid(input.discountApprovalId)) return { error: "Aprovação de desconto inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_confirm_sale", {
    p_store_id: input.storeId,
    p_customer_id: input.customerId,
    p_payment_method: input.paymentMethod,
    p_installments: input.installments,
    p_cash_session_id: input.cashSessionId,
    p_notes: input.notes || null,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty, unit_price: i.unitPrice, discount_pct: i.discountPct })),
    p_order_discount_amount: input.orderDiscountAmount,
    p_discount_approval_id: input.discountApprovalId ?? null,
  });
  if (error) return { error: friendlyError(error) };
  scheduleNotificationEmails();
  revalidatePath("/stock/history");
  revalidatePath("/products");
  revalidatePath("/cash");
  return { id: data as string };
}

export async function cashSessionOpenAction(input: { storeId: string; openingAmount: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_cash_session_open", {
    p_store_id: input.storeId, p_opening_amount: input.openingAmount,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { id: data as string };
}

export async function cashSessionMovementAction(input: { sessionId: string; kind: "supply" | "withdraw"; amount: number; note: string }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cash_session_movement", {
    p_session_id: input.sessionId, p_kind: input.kind, p_amount: input.amount, p_note: input.note || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { ok: true };
}

export async function cashSessionCloseAction(input: {
  sessionId: string; countedAmount: number; discrepancyReason: string; discrepancyDetail: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cash_session_close", {
    p_session_id: input.sessionId, p_counted_amount: input.countedAmount,
    p_discrepancy_reason: input.discrepancyReason || null, p_discrepancy_detail: input.discrepancyDetail || null,
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/cash");
  return { ok: true };
}

// Busca de cliente no PDV (nome, CPF/CNPJ, telefone ou email).
export async function searchCustomersAction(term: string) {
  const q = typeof term === "string" ? term.trim().slice(0, 80) : "";
  if (q.length < 2) return { rows: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_customers_list", { p_term: q, p_with_credit: false, p_limit: 8, p_offset: 0 });
  if (error) return { error: userMessage(error, "pos/searchCustomers") };
  const rows = ((data as { rows?: { id: string; name: string; doc: string | null; phone: string | null }[] } | null)?.rows ?? [])
    .map((c) => ({ id: c.id, name: c.name, doc: c.doc, phone: c.phone }));
  return { rows };
}

// Aprovação de desconto acima de 20%: o gestor digita o PRÓPRIO login no
// caixa do vendedor. A senha é conferida num client isolado (sem cookie,
// sem persistir sessão) — a sessão do vendedor no navegador não muda — e a
// autorização é criada com o JWT do gestor, então fn_grant_discount_approval
// confere o papel dele (financeiro/proprietário) e a rede. Devolve só o id
// da autorização (uso único, 10 min), que vai junto na venda.
export async function requestDiscountApprovalAction(input: { email: string; password: string; storeId: string; maxPct: number }) {
  if (!isEmail(input.email) || typeof input.password !== "string" || !input.password) return { error: "Informe email e senha do gestor." };
  if (!isUuid(input.storeId)) return { error: "Unidade inválida." };
  const pct = Math.round(Number(input.maxPct) * 100) / 100;
  if (!(pct > 0 && pct <= 100)) return { error: "Percentual de desconto inválido." };

  // O vendedor precisa estar logado e na mesma rede que o gestor.
  const seller = await createClient();
  const { data: sellerTenant, error: sellerError } = await seller.rpc("auth_tenant_id");
  if (sellerError || !sellerTenant) return { error: "Sessão expirada. Entre de novo." };

  const { url, anonKey } = supabaseEnv();
  const manager = createSupabaseClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signInError } = await manager.auth.signInWithPassword({ email: input.email.trim(), password: input.password });
  if (signInError) {
    return { error: signInError.code === "invalid_credentials" ? "Email ou senha do gestor incorretos." : userMessage(signInError, "pos/approval.signIn") };
  }
  try {
    const { data: managerTenant, error: tenantError } = await manager.rpc("auth_tenant_id");
    if (tenantError) return { error: userMessage(tenantError, "pos/approval.tenant") };
    if (managerTenant !== sellerTenant) return { error: "Este gestor não pertence a esta rede." };
    const { data, error } = await manager.rpc("fn_grant_discount_approval", { p_store_id: input.storeId, p_max_pct: pct });
    if (error) {
      if (error.message.includes("not authorized")) return { error: "Este usuário não é gestor (financeiro ou proprietário) e não pode aprovar desconto." };
      return { error: userMessage(error, "pos/approval.grant") };
    }
    return { approvalId: data as string };
  } finally {
    // scope local: encerra só esta sessão temporária, não as do gestor em outros aparelhos.
    await manager.auth.signOut({ scope: "local" }).catch(() => undefined);
  }
}
