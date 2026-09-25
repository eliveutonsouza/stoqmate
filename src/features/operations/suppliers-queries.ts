import { createClient } from "@/lib/supabase/server";
import { must } from "@/lib/supabase/must";
import { type RawSearchParams, PAGE_SIZE, oneOf, pageParam, pageRange, param, uuidParam } from "@/lib/list-params";

export const SUPPLIER_LEAD_FILTERS = ["short", "medium", "long", "none"] as const;
export type SupplierLeadFilter = (typeof SUPPLIER_LEAD_FILTERS)[number];

export type SupplierListFilters = {
  q: string | null;
  category: string | null;
  lead: SupplierLeadFilter | null;
  page: number;
};

export function supplierFiltersFromParams(sp: RawSearchParams): SupplierListFilters {
  return {
    q: param(sp, "q"),
    category: uuidParam(sp, "category"),
    lead: oneOf(sp, "lead", SUPPLIER_LEAD_FILTERS),
    page: pageParam(sp),
  };
}

export function supplierListArgs(filters: Omit<SupplierListFilters, "page">, limit: number, offset: number) {
  return { p_term: filters.q, p_category_id: filters.category, p_lead: filters.lead, p_limit: limit, p_offset: offset };
}

// Lista de fornecedores (/suppliers): busca (?q) em nome/CNPJ/email/marcas,
// filtros ?category e ?lead (prazo) e ?page — no servidor via
// fn_suppliers_list.
export async function loadSuppliersList(sp: RawSearchParams) {
  const filters = supplierFiltersFromParams(sp);
  const { offset, limit } = pageRange(filters.page);
  const supabase = await createClient();
  const [list, categories] = await Promise.all([
    supabase.rpc("fn_suppliers_list", supplierListArgs(filters, limit, offset)),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const data = must(list, "loadSuppliersList");
  return {
    filters,
    pageSize: PAGE_SIZE,
    rows: data?.rows ?? [],
    total: Number(data?.total ?? 0),
    catalogTotal: Number(data?.catalog_total ?? 0),
    categories: must(categories, "loadSuppliersList.categories") ?? [],
  };
}
