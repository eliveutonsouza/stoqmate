"use server";

import { createClient } from "@/lib/supabase/server";
import { last30Days } from "@/features/reports/queries";

function toCsv(headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    // Prefixa com aspa simples se começar com =, +, -, @, tab ou CR — Excel/
    // Sheets tratam essas células como fórmula ao abrir o CSV (CSV formula
    // injection), o que executaria conteúdo vindo de nome de produto/cliente.
    const raw = String(v ?? "");
    const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(";")).join("\n");
}

export async function exportCsvAction(kind: "catalog" | "sales" | "profit") {
  const supabase = await createClient();

  if (kind === "catalog") {
    const { data } = await supabase
      .from("products")
      .select("sku, barcode, brand, name, cost_price, sale_price, min_stock, category:categories(name), supplier:suppliers(name), default_location:locations(code)")
      .order("sku");
    const rows = (data ?? []).map((p) => {
      const category = p.category as unknown as { name: string } | null;
      const supplier = p.supplier as unknown as { name: string } | null;
      const location = p.default_location as unknown as { code: string } | null;
      return [
        p.sku, p.barcode ?? "", p.brand ?? "", p.name,
        category?.name ?? "", supplier?.name ?? "", location?.code ?? "",
        p.cost_price, p.sale_price, p.min_stock,
      ];
    });
    return {
      filename: `catalogo-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: toCsv(["SKU", "Código de barras", "Marca", "Nome", "Categoria", "Fornecedor", "Local", "Preço de compra", "Preço de venda", "Estoque mínimo"], rows),
    };
  }

  if (kind === "sales") {
    const { start, end } = last30Days();
    const { data } = await supabase
      .from("sales")
      .select("created_at, total, discount_amount, payment_method, store:stores(name), customer:customers(name)")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at");
    const rows = (data ?? []).map((s) => {
      const store = s.store as unknown as { name: string } | null;
      const customer = s.customer as unknown as { name: string } | null;
      return [
        new Date(s.created_at).toLocaleString("pt-BR"), store?.name ?? "", customer?.name ?? "consumidor final",
        s.payment_method, s.discount_amount, s.total,
      ];
    });
    return {
      filename: `vendas-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: toCsv(["Data", "Unidade", "Cliente", "Pagamento", "Desconto", "Total"], rows),
    };
  }

  const { start, end } = last30Days();
  const { data: report } = await supabase.rpc("fn_sales_report", { p_start: start.toISOString(), p_end: end.toISOString() });
  const rows = (report?.by_product ?? []).map((p: { sku: string; name: string; category_name: string; units: number; cost: number; revenue: number }) => [
    p.sku, p.name, p.category_name, p.units, p.cost, p.revenue, p.revenue - p.cost,
  ]);
  return {
    filename: `lucratividade-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: toCsv(["SKU", "Produto", "Categoria", "Vendidos", "Custo", "Receita", "Lucro"], rows),
  };
}
