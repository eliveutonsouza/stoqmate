"use server";

import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { MOVEMENT_KINDS, movementListArgs } from "@/features/stock/queries";
import { movementLabel } from "@/lib/movement-labels";
import { isUuid } from "@/lib/validation";

const EXPORT_LIMIT = 10000;

type MovementRow = {
  created_at: string; kind: string; qty: number; unit_cost: number | null; unit_price: number | null; reason: string | null;
  product: { sku: string; name: string; category: { name: string } | null } | null;
  store: { name: string } | null;
};

const fmtDateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

// CSV do histórico com o filtro da tela — todas as páginas, até 10.000
// linhas (as mais recentes). `truncated` avisa a tela se passou disso.
export async function exportStockHistoryCsvAction(input: { q?: string | null; kind?: string | null; store?: string | null }) {
  const filters = {
    q: typeof input.q === "string" && input.q.trim() ? input.q.trim().slice(0, 200) : null,
    kind: (MOVEMENT_KINDS as readonly string[]).includes(input.kind ?? "") ? (input.kind as string) : null,
    store: isUuid(input.store) ? input.store : null,
  };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_stock_movements_list", movementListArgs(filters, EXPORT_LIMIT, 0));
  if (error) return { error: "Não foi possível exportar o histórico." };
  const list = data as { rows?: MovementRow[]; total?: number } | null;
  const rows = list?.rows ?? [];
  const total = Number(list?.total ?? 0);
  return {
    total,
    exported: rows.length,
    truncated: total > rows.length,
    csv: toCsv(
      ["Data/hora", "Tipo", "SKU", "Produto", "Categoria", "Unidade", "Qtd", "Custo un.", "Preço un.", "Motivo"],
      rows.map((m) => [
        fmtDateTime.format(new Date(m.created_at)), movementLabel(m.kind),
        m.product?.sku, m.product?.name, m.product?.category?.name, m.store?.name,
        m.qty, m.unit_cost, m.unit_price, m.reason,
      ]),
    ),
  };
}
