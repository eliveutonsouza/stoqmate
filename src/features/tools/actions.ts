"use server";

import { createClient } from "@/lib/supabase/server";
import { toCsv, csvFilename, type CsvCell } from "@/lib/csv";
import { last30Days } from "@/features/reports/queries";
import { paymentLabel } from "@/lib/payment-methods";
import type { SalesReportJson } from "@/features/reports/queries";
import { movementCostMap, productCostMap } from "@/lib/supabase/costs";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { movementLabel } from "@/lib/movement-labels";

export type ExportKind = "catalog" | "sales" | "profit" | "movements" | "suppliers" | "count-sheet";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const one = <T,>(v: unknown) => (Array.isArray(v) ? v[0] : v) as T | null;
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "");

async function build(supabase: Supabase, kind: ExportKind): Promise<{ base: string; headers: string[]; rows: CsvCell[][] }> {
  if (kind === "catalog") {
    const data = await fetchAll((from, to) => supabase
      .from("products")
      .select("id, sku, barcode, brand, name, sale_price, min_stock, category:categories(name), supplier:suppliers(name), default_location:locations(code)")
      .order("sku").range(from, to));
    const costById = await productCostMap(supabase, data.map((p) => p.id));
    return {
      base: "catalogo",
      headers: ["SKU", "Código de barras", "Marca", "Nome", "Categoria", "Fornecedor", "Local", "Preço de compra", "Preço de venda", "Estoque mínimo"],
      rows: data.map((p) => [
        p.sku, p.barcode, p.brand, p.name,
        one<{ name: string }>(p.category)?.name, one<{ name: string }>(p.supplier)?.name, one<{ code: string }>(p.default_location)?.code,
        costById.get(p.id) ?? null, p.sale_price, p.min_stock,
      ]),
    };
  }

  if (kind === "sales") {
    const { start, end } = last30Days();
    const data = await fetchAll((from, to) => supabase
      .from("sales")
      .select("id, created_at, total, discount_amount, payment_method, store:stores(name), customer:customers(name)")
      .gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
      .order("created_at").range(from, to));
    // Formas registradas por venda (dividida vira "PIX 30,00 + Dinheiro 20,00").
    const pays = await fetchAll((from, to) => supabase
      .from("payments")
      .select("document_id, method, amount")
      .eq("document_type", "sale").eq("direction", "in")
      .gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
      .order("created_at").range(from, to));
    const bySale = new Map<string, { method: string; amount: number }[]>();
    for (const p of pays) bySale.set(p.document_id, [...(bySale.get(p.document_id) ?? []), { method: p.method, amount: Number(p.amount) }]);
    const describe = (id: string, fallback: string) => {
      const list = bySale.get(id);
      if (!list?.length) return paymentLabel(fallback);
      if (list.length === 1) return paymentLabel(list[0].method);
      return list.map((p) => `${paymentLabel(p.method)} ${p.amount.toFixed(2).replace(".", ",")}`).join(" + ");
    };
    return {
      base: "vendas",
      headers: ["Data", "Unidade", "Cliente", "Pagamento", "Desconto", "Total"],
      rows: data.map((s) => [
        date(s.created_at), one<{ name: string }>(s.store)?.name, one<{ name: string }>(s.customer)?.name ?? "consumidor final",
        describe(s.id, s.payment_method), s.discount_amount, s.total,
      ]),
    };
  }

  if (kind === "profit") {
    const { start, end } = last30Days();
    const { data: report, error } = await supabase.rpc("fn_sales_report", { p_start: start.toISOString(), p_end: end.toISOString() });
    if (error) throw new Error(error.message);
    const byProduct = ((report as SalesReportJson | null)?.by_product ?? []) as { sku: string; name: string; category_name: string; units: number; cost: number; revenue: number }[];
    return {
      base: "lucratividade",
      headers: ["SKU", "Produto", "Categoria", "Vendidos", "Custo", "Receita", "Lucro"],
      rows: byProduct.map((p) => [p.sku, p.name, p.category_name, p.units, p.cost, p.revenue, p.revenue - p.cost]),
    };
  }

  if (kind === "movements") {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const data = await fetchAll((from, to) => supabase
      .from("stock_movements")
      .select("id, created_at, kind, qty, before_qty, after_qty, unit_price, reason, justification, product:products(sku, name), store:stores(name)")
      .gte("created_at", since.toISOString())
      .order("created_at").range(from, to));
    const costById = await movementCostMap(supabase, data.map((m) => m.id));
    return {
      base: "movimentacoes-90-dias",
      headers: ["Data", "Unidade", "Tipo", "SKU", "Produto", "Quantidade", "Saldo antes", "Saldo depois", "Custo un.", "Preço un.", "Motivo", "Justificativa"],
      rows: data.map((m) => {
        const product = one<{ sku: string; name: string }>(m.product);
        return [
          date(m.created_at), one<{ name: string }>(m.store)?.name, movementLabel(m.kind),
          product?.sku, product?.name, m.qty, m.before_qty, m.after_qty, costById.get(m.id) ?? null, m.unit_price, m.reason, m.justification,
        ];
      }),
    };
  }

  if (kind === "suppliers") {
    const [suppliers, orders] = await Promise.all([
      fetchAll((from, to) => supabase
        .from("suppliers")
        .select("id, name, cnpj, phone, order_email, lead_time_days, min_order_value, payment_terms, active")
        .order("name").range(from, to)),
      fetchAll((from, to) => supabase
        .from("purchase_orders")
        .select("supplier_id, status, created_at, received_at")
        .order("created_at").range(from, to)),
    ]);
    const stats = new Map<string, { total: number; open: number; last: string | null }>();
    for (const o of orders) {
      const s = stats.get(o.supplier_id) ?? { total: 0, open: 0, last: null };
      s.total += 1;
      if (o.status === "sent") s.open += 1;
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      stats.set(o.supplier_id, s);
    }
    return {
      base: "fornecedores-e-compras",
      headers: ["Fornecedor", "CNPJ", "Telefone", "Email de pedido", "Prazo (dias)", "Pedido mínimo", "Condição de pagamento", "Ativo", "Pedidos", "Pedidos em aberto", "Último pedido"],
      rows: suppliers.map((s) => {
        const st = stats.get(s.id);
        return [
          s.name, s.cnpj, s.phone, s.order_email, s.lead_time_days, s.min_order_value, s.payment_terms,
          s.active ? "sim" : "não", st?.total ?? 0, st?.open ?? 0, st?.last ? date(st.last) : "",
        ];
      }),
    };
  }

  // Folha de contagem: o saldo do sistema fica de fora de propósito, pra
  // quem conta não "acertar" pelo número esperado.
  const data = await fetchAll((from, to) => supabase
    .from("products")
    .select("sku, barcode, brand, name, attrs, category:categories(name), default_location:locations(code)")
    .eq("active", true)
    .order("sku").range(from, to));
  return {
    base: "folha-de-contagem",
    headers: ["Local", "SKU", "Código de barras", "Produto", "Variação", "Categoria", "Quantidade contada"],
    rows: data
      .map((p) => [
        one<{ code: string }>(p.default_location)?.code ?? "", p.sku, p.barcode, `${p.brand ? `${p.brand} ` : ""}${p.name}`,
        Object.values((p.attrs as Record<string, string>) ?? {}).filter(Boolean).join(" · "),
        one<{ name: string }>(p.category)?.name, "",
      ] as CsvCell[])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))),
  };
}

const EXPORT_KINDS: readonly ExportKind[] = ["catalog", "sales", "profit", "movements", "suppliers", "count-sheet"];

export async function exportCsvAction(kind: ExportKind) {
  if (!EXPORT_KINDS.includes(kind)) return { error: "Tipo de exportação inválido." };
  const supabase = await createClient();
  // Mesma regra da tela (/exports é área "reports"): a action é endpoint
  // público, então confere de novo em vez de confiar no menu escondido.
  const { data: allowed, error: accessError } = await supabase.rpc("has_access", { p_area: "reports", p_min_level: 1 });
  if (accessError) {
    console.error("[exports] has_access", accessError.message);
    return { error: "Não foi possível gerar o arquivo agora. Tente de novo em instantes." };
  }
  if (!allowed) return { error: "Seu perfil não tem permissão para exportar dados." };
  // Lucratividade é custo × venda: só pra quem vê custo (área "money").
  if (kind === "profit") {
    const { data: canSeeCost, error: costError } = await supabase.rpc("fn_can_see_cost");
    if (costError) {
      console.error("[exports] fn_can_see_cost", costError.message);
      return { error: "Não foi possível gerar o arquivo agora. Tente de novo em instantes." };
    }
    if (!canSeeCost) return { error: "Seu perfil não tem acesso a custo e lucratividade." };
  }
  try {
    const { base, headers, rows } = await build(supabase, kind);
    return { filename: csvFilename(base), csv: toCsv(headers, rows) };
  } catch (err) {
    console.error(`[exports] ${kind}:`, err instanceof Error ? err.message : err);
    return { error: "Não foi possível gerar o arquivo agora. Tente de novo em instantes." };
  }
}
