"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { userMessage } from "@/lib/errors";
import { allUuids, formatCnpj, isCnpj, isEmail, isUuid, textError } from "@/lib/validation";

export async function createSupplierAction(input: {
  name: string;
  cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  salesRep?: string;
  address?: string;
  categoryIds: string[];
  brands: string;
  leadTimeDays: number | null;
  minOrderValue?: number | null;
  paymentTerms?: string;
  notes: string;
}) {
  if (!allUuids(input.categoryIds)) return { error: "Categoria inválida." };
  const nameError = textError(input.name, "o nome do fornecedor", 2, 120);
  if (nameError) return { error: nameError };
  if (input.cnpj?.trim() && !isCnpj(input.cnpj)) return { error: "CNPJ inválido — confira os 14 dígitos." };
  if (input.email?.trim() && !isEmail(input.email)) return { error: "Email de pedidos inválido." };
  const supabase = await createClient();

  // Fornecedor + categorias numa transação (fn_create_supplier).
  const { data: supplierId, error } = await supabase.rpc("fn_create_supplier", {
    p_supplier: {
      name: input.name.trim(),
      cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : "",
      phone: input.phone,
      whatsapp: input.whatsapp ?? "",
      order_email: input.email,
      sales_rep: input.salesRep ?? "",
      address: input.address ?? "",
      brands: input.brands ? input.brands.split(",").map((b) => b.trim()).filter(Boolean) : [],
      lead_time_days: input.leadTimeDays,
      min_order_value: input.minOrderValue ?? null,
      payment_terms: input.paymentTerms ?? "",
      notes: input.notes,
    },
    p_category_ids: input.categoryIds,
  });
  if (error) return { error: userMessage(error, "operations/createSupplier") };
  const supplier = { id: supplierId as string };

  const { error: auditError } = await supabase.rpc("fn_write_audit", {
    p_kind: "supplier",
    p_message: `Cadastrou o fornecedor "${input.name}"`,
    p_target_type: "supplier",
    p_target_id: supplier.id,
  });
  // Auditoria não desfaz a operação já gravada, mas a falha não pode sumir.
  if (auditError) console.error(`[audit] falhou: ${auditError.message}`);

  revalidatePath("/suppliers");
  return { id: supplier.id as string };
}

// Troca os vínculos de categoria numa transação (fn_set_*_categories):
// grava os novos e apaga os que saíram. Ids chegam validados como uuid —
// antes iam crus pra dentro de um filtro PostgREST montado com string.
async function syncCategoryLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  owner: "supplier" | "location",
  ownerId: string,
  categoryIds: string[],
) {
  const { error } = owner === "supplier"
    ? await supabase.rpc("fn_set_supplier_categories", { p_supplier_id: ownerId, p_category_ids: categoryIds })
    : await supabase.rpc("fn_set_location_categories", { p_location_id: ownerId, p_category_ids: categoryIds });
  return error ? userMessage(error, `operations/syncCategoryLinks.${owner}`) : null;
}

export async function updateSupplierAction(input: {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  salesRep?: string;
  address?: string;
  categoryIds: string[];
  brands: string;
  leadTimeDays: number | null;
  minOrderValue?: number | null;
  paymentTerms?: string;
  notes: string;
}) {
  if (!isUuid(input.id) || !allUuids(input.categoryIds)) return { error: "Categoria inválida." };
  const updateNameError = textError(input.name, "o nome do fornecedor", 2, 120);
  if (updateNameError) return { error: updateNameError };
  if (input.cnpj?.trim() && !isCnpj(input.cnpj)) return { error: "CNPJ inválido — confira os 14 dígitos." };
  if (input.email?.trim() && !isEmail(input.email)) return { error: "Email de pedidos inválido." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      cnpj: input.cnpj?.trim() ? formatCnpj(input.cnpj) : null,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      order_email: input.email || null,
      sales_rep: input.salesRep || null,
      address: input.address ? { full: input.address } : null,
      brands: input.brands ? input.brands.split(",").map((b) => b.trim()).filter(Boolean) : [],
      lead_time_days: input.leadTimeDays,
      min_order_value: input.minOrderValue ?? null,
      payment_terms: input.paymentTerms || null,
      notes: input.notes || null,
    })
    .eq("id", input.id);
  if (error) return { error: userMessage(error, "operations/actions") };

  const linkError = await syncCategoryLinks(supabase, "supplier", input.id, input.categoryIds);
  if (linkError) return { error: linkError };

  revalidatePath("/suppliers");
  revalidatePath("/suppliers/detail");
  return { id: input.id };
}

// Inativo some dos seletores de entrada e pedido de compra novos, mas o
// histórico e os produtos que já apontam pra ele seguem intactos.
export async function setSupplierActiveAction(input: { id: string; active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update({ active: input.active }).eq("id", input.id);
  if (error) return { error: userMessage(error, "operations/actions") };
  revalidatePath("/suppliers");
  revalidatePath("/stock/entry");
  revalidatePath("/purchase-orders/new");
  return { ok: true };
}

export async function createLocationAction(input: {
  storeId: string;
  code: string;
  description: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: location, error } = await supabase
    .from("locations")
    .insert({ tenant_id: tenantId, store_id: input.storeId, code: input.code.toUpperCase(), description: input.description || null })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : userMessage(error, "operations/actions") };

  revalidatePath("/shelves");
  return { id: location.id as string };
}

export async function updateLocationAction(input: {
  id: string;
  code: string;
  description: string;
  categoryIds: string[];
}) {
  if (!isUuid(input.id) || !allUuids(input.categoryIds)) return { error: "Categoria inválida." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .update({ code: input.code.toUpperCase(), description: input.description || null })
    .eq("id", input.id);
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : userMessage(error, "operations/actions") };

  const linkError = await syncCategoryLinks(supabase, "location", input.id, input.categoryIds);
  if (linkError) return { error: linkError };

  revalidatePath("/shelves");
  return { id: input.id };
}

export async function deleteLocationAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) return { error: userMessage(error, "operations/actions") };
  revalidatePath("/shelves");
  return { ok: true };
}
