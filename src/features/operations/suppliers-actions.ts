"use server";

import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { isUuid } from "@/lib/validation";
import { SUPPLIER_LEAD_FILTERS, type SupplierLeadFilter, supplierListArgs } from "@/features/operations/suppliers-queries";

const EXPORT_LIMIT = 10000;

type SupplierRow = {
  name: string; cnpj: string | null; phone: string | null; order_email: string | null;
  brands: string[] | null; lead_time_days: number | null; active: boolean;
  cats: { name: string }[];
};

// CSV de TODOS os fornecedores que batem com o filtro da tela (não só a
// página visível). Leitura via RLS do usuário logado.
export async function exportSuppliersCsvAction(input: { q?: string | null; category?: string | null; lead?: string | null }) {
  const filters = {
    q: typeof input.q === "string" && input.q.trim() ? input.q.trim().slice(0, 200) : null,
    category: isUuid(input.category) ? input.category : null,
    lead: (SUPPLIER_LEAD_FILTERS as readonly string[]).includes(input.lead ?? "") ? (input.lead as SupplierLeadFilter) : null,
  };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_suppliers_list", supplierListArgs(filters, EXPORT_LIMIT, 0));
  if (error) return { error: "Não foi possível exportar os fornecedores." };
  const list = data as { rows?: SupplierRow[]; total?: number } | null;
  const rows = list?.rows ?? [];
  return {
    total: Number(list?.total ?? 0),
    exported: rows.length,
    csv: toCsv(
      ["Nome", "CNPJ", "Telefone", "Email de pedidos", "Categorias", "Marcas", "Prazo (dias)", "Status"],
      rows.map((s) => [
        s.name, s.cnpj, s.phone, s.order_email, s.cats.map((c) => c.name).join(", "),
        (s.brands || []).join(", "), s.lead_time_days, s.active ? "Ativo" : "Inativo",
      ]),
    ),
  };
}
