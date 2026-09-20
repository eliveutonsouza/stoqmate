"use server";

import { createClient } from "@/lib/supabase/server";
import { aiCompleteJSON } from "@/lib/anthropic";

// Débito -> chamada -> log. Se a chamada à Anthropic falhar depois do
// débito, estorna o crédito (o lojista não paga por uma resposta que não
// recebeu). Todo op novo (enrich/forecast/ocr) passa por aqui — só muda
// p_op_id, system e prompt.
async function runAiOp({
  opId,
  minLevel,
  system,
  prompt,
  maxTokens,
}: {
  opId: string;
  minLevel: number;
  system: string;
  prompt: string;
  maxTokens?: number;
}) {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_access", { p_area: "ai", p_min_level: minLevel });
  if (!allowed) throw new Error("Seu perfil não tem permissão para usar IA aqui.");

  const { error: debitError } = await supabase.rpc("fn_ai_debit_credits", { p_op_id: opId });
  if (debitError) throw new Error(debitError.message);

  try {
    const result = await aiCompleteJSON({ system, prompt, maxTokens });
    await supabase.rpc("fn_write_ai_usage", {
      p_op_id: opId,
      p_model: result.model,
      p_tokens_in: result.tokensIn,
      p_tokens_out: result.tokensOut,
      p_cost_usd: null,
      p_status: "ok",
    });
    return result.data;
  } catch (err) {
    await supabase.rpc("fn_ai_refund_credits", { p_op_id: opId });
    const message = err instanceof Error ? err.message : String(err);
    await supabase.rpc("fn_write_ai_usage", {
      p_op_id: opId,
      p_model: "claude-haiku-4-5-20251001",
      p_tokens_in: null,
      p_tokens_out: null,
      p_cost_usd: null,
      p_status: "error",
      p_error_message: message,
    });
    throw err;
  }
}

export async function askInventoryAction(question: string) {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_access", { p_area: "ai", p_min_level: 1 });
  if (!allowed) throw new Error("Seu perfil não tem permissão para usar IA aqui.");

  const { data: categories } = await supabase.from("categories").select("name").order("name");
  const { data: products } = await supabase
    .from("products")
    .select(`
      sku, brand, name, attrs, cost_price, sale_price, min_stock,
      category:categories(name), supplier:suppliers(name), default_location:locations(code),
      stock_balances(qty)
    `)
    .eq("active", true);

  const rows = (products ?? []).map((p) => {
    const stock = (p.stock_balances as unknown as { qty: number }[]).reduce((s, b) => s + b.qty, 0);
    const cost = Number(p.cost_price);
    const sale = Number(p.sale_price);
    const category = p.category as unknown as { name: string } | null;
    const supplier = p.supplier as unknown as { name: string } | null;
    const loc = p.default_location as unknown as { code: string } | null;
    return {
      sku: p.sku, name: `${p.brand} ${p.name}`, variant: Object.values(p.attrs || {}).join(" / "),
      stock, minStock: p.min_stock, sale, cost,
      margin: sale > 0 ? ((sale - cost) / sale) * 100 : 0,
      category: category?.name ?? "", brand: p.brand, loc: loc?.code ?? "", supplier: supplier?.name ?? "",
    };
  });

  const { error: debitError } = await supabase.rpc("fn_ai_debit_credits", { p_op_id: "ask" });
  if (debitError) throw new Error(debitError.message);

  type FilterSpec = {
    title?: string; note?: string; confidence?: number;
    filters?: { field: string; op: string; value: unknown }[];
    sort?: { field: string; dir: "asc" | "desc" };
    metric?: "count" | "sumSale" | "sumStock" | null;
  };
  let spec: FilterSpec;
  try {
    const result = await aiCompleteJSON({
      system: "Você traduz perguntas em português sobre estoque numa especificação de consulta JSON. Você NUNCA calcula nem conta — apenas descreve o filtro. Quem executa é o sistema.",
      prompt: `Campos disponíveis no catálogo:
- stock (número) saldo somado em toda a rede
- minStock (número) estoque mínimo cadastrado no produto
- sale (número) preço de venda em reais
- cost (número) preço de custo em reais
- margin (número) margem percentual
- category (texto) uma de: ${(categories ?? []).map((c) => c.name).join(", ")}
- brand (texto) marca
- name (texto) nome do produto
- loc (texto) código do local de estoque padrão
- supplier (texto) fornecedor

Operadores: "lt", "lte", "gt", "gte", "eq", "contains", "belowMin" (compara stock com minStock), "any".

Pergunta do lojista: "${question}"

Devolva JSON com a especificação. Nada de contagens ou valores calculados.
{"title":"título curto do resultado",
 "filters":[{"field":"stock","op":"belowMin","value":null}],
 "sort":{"field":"stock","dir":"asc"},
 "metric":"count"|"sumSale"|"sumStock"|null,
 "note":"uma observação útil sobre o que foi consultado, sem números",
 "confidence":0-100}`,
      maxTokens: 700,
    });
    spec = result.data as FilterSpec;
    await supabase.rpc("fn_write_ai_usage", {
      p_op_id: "ask", p_model: result.model, p_tokens_in: result.tokensIn, p_tokens_out: result.tokensOut,
      p_cost_usd: null, p_status: "ok",
    });
  } catch (err) {
    await supabase.rpc("fn_ai_refund_credits", { p_op_id: "ask" });
    const message = err instanceof Error ? err.message : String(err);
    await supabase.rpc("fn_write_ai_usage", {
      p_op_id: "ask", p_model: "claude-haiku-4-5-20251001", p_tokens_in: null, p_tokens_out: null,
      p_cost_usd: null, p_status: "error", p_error_message: message,
    });
    throw err;
  }

  // Execução determinística sobre os dados reais — o modelo só descreveu o
  // filtro, quem soma/conta/ordena é o servidor.
  const norm = (v: unknown) => String(v == null ? "" : v).toLowerCase();
  const test = (row: Record<string, unknown>, f: { field: string; op: string; value: unknown }) => {
    const val = row[f.field];
    switch (f.op) {
      case "belowMin": return (row.stock as number) < (row.minStock as number);
      case "lt": return Number(val) < Number(f.value);
      case "lte": return Number(val) <= Number(f.value);
      case "gt": return Number(val) > Number(f.value);
      case "gte": return Number(val) >= Number(f.value);
      case "eq": return norm(val) === norm(f.value);
      case "contains": return norm(val).includes(norm(f.value));
      default: return true;
    }
  };
  type Row = (typeof rows)[number];
  let result = rows.filter((r) => (spec.filters ?? []).every((f) => test(r as unknown as Record<string, unknown>, f)));
  if (spec.sort?.field) {
    const field = spec.sort.field as keyof Row;
    const dir = spec.sort.dir === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const av = a[field], bv = b[field];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * dir;
    });
  }
  const metric = spec.metric === "sumSale"
    ? result.reduce((s, r) => s + r.sale * r.stock, 0)
    : spec.metric === "sumStock"
      ? result.reduce((s, r) => s + r.stock, 0)
      : result.length;

  return { spec, rows: result, metric, metricKind: spec.metric ?? "count" };
}

export async function classifyProductAction(input: {
  description: string;
  categories: { name: string; unit: string; attributes: { key: string; values: string[] }[] }[];
}) {
  const catalogHint = input.categories
    .map((c) => `${c.name} (unidade ${c.unit}): ${c.attributes.map((a) => `${a.key} [${a.values.join("/")}]`).join(", ")}`)
    .join("\n");

  return runAiOp({
    opId: "classify",
    minLevel: 2,
    system:
      "Você classifica produtos no catálogo de um sistema de estoque, escolhendo somente entre as categorias e valores de atributo já cadastrados.",
    prompt: `Categorias disponíveis e seus atributos (atributo: valores permitidos):\n${catalogHint}\n\nDescrição livre do produto, como o lojista digitou:\n"${input.description}"\n\nClassifique. Use apenas categoria existente e apenas valores permitidos do esquema dela. Se um atributo não for dedutível, omita a chave.\nDevolva JSON:\n{"category":"nome exato da categoria","brand":"marca","productName":"nome limpo e curto do produto","attributes":{"chave":"valor"},"unit":"unidade de medida","confidence":0-100,"reasons":["por que essa categoria","como deduziu os atributos"]}`,
    maxTokens: 900,
  });
}
