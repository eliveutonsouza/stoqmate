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

  await supabase.rpc("fn_write_audit", {
    p_kind: "supplier",
    p_message: `Cadastrou o fornecedor "${input.name}"`,
    p_target_type: "supplier",
    p_target_id: supplier.id,
  });

  revalidatePath("/suppliers");
  return { id: supplier.id as string };
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

  await supabase.from("supplier_categories").delete().eq("supplier_id", input.id);
  if (input.categoryIds.length) {
    const { error: catError } = await supabase
      .from("supplier_categories")
      .insert(input.categoryIds.map((categoryId) => ({ supplier_id: input.id, category_id: categoryId })));
    if (catError) return { error: catError.message };
  }

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

  await supabase.from("location_categories").delete().eq("location_id", input.id);
  if (input.categoryIds.length) {
    const { error: catError } = await supabase
      .from("location_categories")
      .insert(input.categoryIds.map((categoryId) => ({ location_id: input.id, category_id: categoryId })));
    if (catError) return { error: catError.message };
  }

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
