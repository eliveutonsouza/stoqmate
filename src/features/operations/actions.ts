"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";
import { NOT_FOUND_ERROR, userMessage } from "@/lib/errors";
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
  if (!isUuid(input.id)) return { error: "Fornecedor inválido." };
  if (!allUuids(input.categoryIds)) return { error: "Categoria inválida." };
  const updateNameError = textError(input.name, "o nome do fornecedor", 2, 120);
  if (updateNameError) return { error: updateNameError };
  if (input.cnpj?.trim() && !isCnpj(input.cnpj)) return { error: "CNPJ inválido — confira os 14 dígitos." };
  if (input.email?.trim() && !isEmail(input.email)) return { error: "Email de pedidos inválido." };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
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
    .eq("id", input.id)
    .select("id");
  if (error) return { error: userMessage(error, "operations/actions") };
  if (!updated?.length) return { error: NOT_FOUND_ERROR };

  const linkError = await syncCategoryLinks(supabase, "supplier", input.id, input.categoryIds);
  if (linkError) return { error: linkError };

  revalidatePath("/suppliers");
  revalidatePath("/suppliers/detail");
  return { id: input.id };
}

// Inativo some dos seletores de entrada e pedido de compra novos, mas o
// histórico e os produtos que já apontam pra ele seguem intactos.
export async function setSupplierActiveAction(input: { id: string; active: boolean }) {
  if (!isUuid(input.id) || typeof input.active !== "boolean") return { error: "Fornecedor inválido." };
  const supabase = await createClient();
  const { data: updated, error } = await supabase.from("suppliers").update({ active: input.active }).eq("id", input.id).select("id");
  if (error) return { error: userMessage(error, "operations/actions") };
  if (!updated?.length) return { error: NOT_FOUND_ERROR };
  revalidatePath("/suppliers");
  revalidatePath("/suppliers/detail");
  revalidatePath("/stock/entry");
  revalidatePath("/purchase-orders/new");
  return { ok: true };
}

export async function createLocationAction(input: {
  storeId: string;
  code: string;
  description: string;
}) {
  if (!isUuid(input.storeId)) return { error: "Unidade inválida." };
  const locationError = textError(input.code, "o código do local", 1, 30) ?? (input.description?.length > 200 ? "A descrição pode ter no máximo 200 caracteres." : null);
  if (locationError) return { error: locationError };
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase).catch(() => null);
  if (!tenantId) return { error: "Sessão expirada. Entre de novo." };

  const { data: location, error } = await supabase
    .from("locations")
    .insert({ tenant_id: tenantId, store_id: input.storeId, code: input.code.trim().toUpperCase(), description: input.description?.trim() || null })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : userMessage(error, "operations/actions") };

  revalidateLocations();
  return { id: location.id as string };
}

export async function updateLocationAction(input: {
  id: string;
  code: string;
  description: string;
  categoryIds: string[];
}) {
  if (!isUuid(input.id)) return { error: "Local inválido." };
  if (!allUuids(input.categoryIds)) return { error: "Categoria inválida." };
  const locationError = textError(input.code, "o código do local", 1, 30) ?? (input.description?.length > 200 ? "A descrição pode ter no máximo 200 caracteres." : null);
  if (locationError) return { error: locationError };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("locations")
    .update({ code: input.code.trim().toUpperCase(), description: input.description?.trim() || null })
    .eq("id", input.id)
    .select("id");
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : userMessage(error, "operations/actions") };
  if (!updated?.length) return { error: NOT_FOUND_ERROR };

  const linkError = await syncCategoryLinks(supabase, "location", input.id, input.categoryIds);
  if (linkError) return { error: linkError };

  revalidateLocations();
  return { id: input.id };
}

export async function deleteLocationAction(id: string) {
  if (!isUuid(id)) return { error: "Local inválido." };
  const supabase = await createClient();
  const { data: deleted, error } = await supabase.from("locations").delete().eq("id", id).select("id");
  if (error) return { error: userMessage(error, "operations/actions") };
  if (!deleted?.length) return { error: NOT_FOUND_ERROR };
  revalidateLocations();
  return { ok: true };
}

// Local aparece na lista, na entrada de estoque e no formulário de produto.
function revalidateLocations() {
  revalidatePath("/shelves");
  revalidatePath("/stock/entry");
  revalidatePath("/products/new");
  revalidatePath("/products/edit");
}
