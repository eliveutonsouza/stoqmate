"use server";

import { revalidatePath } from "next/cache";
import { createClient, getTenantId } from "@/lib/supabase/server";

export async function createSupplierAction(input: {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  categoryIds: string[];
  brands: string;
  leadTimeDays: number | null;
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
      order_email: input.email || null,
      brands: input.brands ? input.brands.split(",").map((b) => b.trim()).filter(Boolean) : [],
      lead_time_days: input.leadTimeDays,
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

  revalidatePath("/suppliers");
  return { id: supplier.id as string };
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
