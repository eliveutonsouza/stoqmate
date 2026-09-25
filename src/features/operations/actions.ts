"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      cnpj: input.cnpj || null,
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
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (input.categoryIds.length) {
    const { error: catError } = await supabase
      .from("supplier_categories")
      .insert(input.categoryIds.map((categoryId) => ({ supplier_id: supplier.id, category_id: categoryId })));
    if (catError) return { error: catError.message };
  }

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

// Troca os vínculos de categoria sem janela vazia: grava os novos primeiro
// (upsert idempotente) e só então apaga os que saíram. Antes era apaga-tudo
// e reinsere — se o insert falhasse, o fornecedor/local ficava sem categoria.
async function syncCategoryLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "supplier_categories" | "location_categories",
  ownerColumn: "supplier_id" | "location_id",
  ownerId: string,
  categoryIds: string[],
) {
  if (categoryIds.length) {
    const { error } = await supabase
      .from(table)
      .upsert(categoryIds.map((categoryId) => ({ [ownerColumn]: ownerId, category_id: categoryId })), {
        onConflict: `${ownerColumn},category_id`,
        ignoreDuplicates: true,
      });
    if (error) return "Não foi possível salvar as categorias. Tente de novo.";
  }
  let removal = supabase.from(table).delete().eq(ownerColumn, ownerId);
  if (categoryIds.length) removal = removal.not("category_id", "in", `(${categoryIds.join(",")})`);
  const { error } = await removal;
  return error ? "Não foi possível atualizar as categorias. Tente de novo." : null;
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
  const supabase = await createClient();

  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      cnpj: input.cnpj || null,
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
  if (error) return { error: error.message };

  const linkError = await syncCategoryLinks(supabase, "supplier_categories", "supplier_id", input.id, input.categoryIds);
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
  if (error) return { error: error.message };
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
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : error.message };

  revalidatePath("/shelves");
  return { id: location.id as string };
}

export async function updateLocationAction(input: {
  id: string;
  code: string;
  description: string;
  categoryIds: string[];
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .update({ code: input.code.toUpperCase(), description: input.description || null })
    .eq("id", input.id);
  if (error) return { error: error.code === "23505" ? "Já existe um local com esse código nesta unidade." : error.message };

  const linkError = await syncCategoryLinks(supabase, "location_categories", "location_id", input.id, input.categoryIds);
  if (linkError) return { error: linkError };

  revalidatePath("/shelves");
  return { id: input.id };
}

export async function deleteLocationAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shelves");
  return { ok: true };
}
