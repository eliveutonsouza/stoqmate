"use server";

import { createClient } from "@/lib/supabase/server";
import { aiCompleteJSON, type AiAttachment } from "@/lib/anthropic";
import { loadOcrContext } from "@/features/ai-flows/queries";
import { GENERIC_ERROR, userMessage } from "@/lib/errors";
import { productCostMap } from "@/lib/supabase/costs";

// Server Action que lança tem a mensagem trocada por um texto genérico no
// build de produção — o lojista nunca via "créditos insuficientes". Toda
// action exportada devolve { data } ou { error }; UserFacingError carrega
// texto pensado pra pessoa, qualquer outra exceção vira genérico + log.
class UserFacingError extends Error {}

type AiResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

async function asResult<T>(context: string, fn: () => Promise<T>): Promise<AiResult<T>> {
  try {
    return { data: await fn() };
  } catch (err) {
    if (err instanceof UserFacingError) return { error: err.message };
    console.error(`[ai] ${context}`, err);
    return { error: GENERIC_ERROR };
  }
}

// Custo em crédito é fixo por operação; sem teto, um prompt gigante sairia
// pelo preço de um pequeno. ~60k caracteres ≈ 15k tokens de entrada.
const MAX_PROMPT_CHARS = 60_000;
const MAX_QUESTION_CHARS = 500;

// Falha de estorno/log não pode derrubar a resposta ao usuário, mas também
// não pode sumir: fica no log do servidor com o op para conciliação.
function logIfFailed(what: string, opId: string, res: { error: { message: string } | null }) {
  if (res.error) console.error(`[ai] ${what} falhou (op=${opId}): ${res.error.message}`);
}

async function requireAi(supabase: Awaited<ReturnType<typeof createClient>>, minLevel: number) {
  const { data: allowed, error } = await supabase.rpc("has_access", { p_area: "ai", p_min_level: minLevel });
  if (error) throw new UserFacingError("Não foi possível verificar sua permissão agora. Tente de novo.");
  if (!allowed) throw new UserFacingError("Seu perfil não tem permissão para usar IA aqui.");
}

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
  attachment,
}: {
  opId: string;
  minLevel: number;
  system: string;
  prompt: string;
  maxTokens?: number;
  attachment?: AiAttachment;
}) {
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new UserFacingError("Entrada grande demais para a IA. Reduza o texto ou a quantidade de itens.");
  }
  const supabase = await createClient();
  await requireAi(supabase, minLevel);

  const { error: debitError } = await supabase.rpc("fn_ai_debit_credits", { p_op_id: opId });
  if (debitError) throw new UserFacingError(userMessage(debitError, "ai/debit"));

  const startedAt = Date.now();
  try {
    const result = await aiCompleteJSON({ system, prompt, maxTokens, attachment });
    logIfFailed("registro de uso", opId, await supabase.rpc("fn_write_ai_usage", {
      p_op_id: opId,
      p_model: result.model,
      p_tokens_in: result.tokensIn,
      p_tokens_out: result.tokensOut,
      p_cost_usd: result.costUsd,
      p_status: "ok",
      p_latency_ms: Date.now() - startedAt,
    }));
    return result.data;
  } catch (err) {
    logIfFailed("estorno", opId, await supabase.rpc("fn_ai_refund_credits", { p_op_id: opId }));
    const message = err instanceof Error ? err.message : String(err);
    logIfFailed("registro de uso", opId, await supabase.rpc("fn_write_ai_usage", {
      p_op_id: opId,
      p_model: "claude-haiku-4-5-20251001",
      p_tokens_in: null,
      p_tokens_out: null,
      p_cost_usd: null,
      p_status: "error",
      p_error_message: message,
      p_latency_ms: Date.now() - startedAt,
    }));
    throw err;
  }
}

async function askInventoryActionImpl(question: string) {
  if (question.trim().length > MAX_QUESTION_CHARS) {
    throw new UserFacingError(`Pergunta longa demais (máximo ${MAX_QUESTION_CHARS} caracteres).`);
  }
  const supabase = await createClient();
  await requireAi(supabase, 1);

  const categoriesRes = await supabase.from("categories").select("name").order("name");
  const productsRes = await supabase
    .from("products")
    .select(`
      id, sku, brand, name, attrs, sale_price, min_stock,
      category:categories(name), supplier:suppliers(name), default_location:locations(code),
      stock_balances(qty)
    `)
    .eq("active", true);
  // Sem catálogo não há o que consultar — e o crédito ainda não foi debitado.
  if (categoriesRes.error || productsRes.error) {
    throw new Error(`catálogo: ${categoriesRes.error?.message ?? productsRes.error?.message}`);
  }
  const categories = categoriesRes.data;
  const products = productsRes.data;
  const costById = await productCostMap(supabase, (products ?? []).map((p) => p.id));

  const rows = (products ?? []).map((p) => {
    const stock = (p.stock_balances as unknown as { qty: number }[]).reduce((s, b) => s + b.qty, 0);
    const cost = costById.get(p.id) ?? 0;
    const sale = Number(p.sale_price);
    const category = p.category as unknown as { name: string } | null;
    const supplier = p.supplier as unknown as { name: string } | null;
    const loc = p.default_location as unknown as { code: string } | null;
    return {
      id: p.id, sku: p.sku, name: `${p.brand} ${p.name}`, variant: Object.values(p.attrs || {}).join(" / "),
      stock, minStock: p.min_stock, sale, cost,
      margin: sale > 0 ? ((sale - cost) / sale) * 100 : 0,
      category: category?.name ?? "", brand: p.brand, loc: loc?.code ?? "", supplier: supplier?.name ?? "",
    };
  });

  const { error: debitError } = await supabase.rpc("fn_ai_debit_credits", { p_op_id: "ask" });
  if (debitError) throw new UserFacingError(userMessage(debitError, "ai/debit"));

  type FilterSpec = {
    title?: string; note?: string; confidence?: number;
    filters?: { field: string; op: string; value: unknown }[];
    sort?: { field: string; dir: "asc" | "desc" };
    metric?: "count" | "sumSale" | "sumStock" | null;
  };
  let spec: FilterSpec;
  const startedAt = Date.now();
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
    logIfFailed("registro de uso", "ask", await supabase.rpc("fn_write_ai_usage", {
      p_op_id: "ask", p_model: result.model, p_tokens_in: result.tokensIn, p_tokens_out: result.tokensOut,
      p_cost_usd: result.costUsd, p_status: "ok", p_latency_ms: Date.now() - startedAt,
    }));
  } catch (err) {
    logIfFailed("estorno", "ask", await supabase.rpc("fn_ai_refund_credits", { p_op_id: "ask" }));
    const message = err instanceof Error ? err.message : String(err);
    logIfFailed("registro de uso", "ask", await supabase.rpc("fn_write_ai_usage", {
      p_op_id: "ask", p_model: "claude-haiku-4-5-20251001", p_tokens_in: null, p_tokens_out: null,
      p_cost_usd: null, p_status: "error", p_error_message: message, p_latency_ms: Date.now() - startedAt,
    }));
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

async function classifyProductActionImpl(input: {
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

async function enrichCatalogActionImpl(
  targets: { sku: string; categoryName: string; name: string; known: Record<string, string>; missing: string[] }[],
  categories: { name: string; unit: string; attributes: { key: string; values: string[] }[] }[],
) {
  const schemaHint = categories
    .map((c) => `${c.name}: ${c.attributes.map((a) => `${a.key} [${a.values.join("/")}]`).join(", ")}`)
    .join("\n");
  const targetsHint = targets
    .map((t) => `SKU ${t.sku} | categoria ${t.categoryName} | nome "${t.name}" | já conhecido: ${JSON.stringify(t.known)} | faltando: ${t.missing.join(", ")}`)
    .join("\n");

  return runAiOp({
    opId: "enrich",
    minLevel: 2,
    system: "Você completa atributos faltantes no catálogo de um sistema de estoque, usando apenas o que é dedutível do nome do produto.",
    prompt: `Esquemas de categoria (atributo: valores permitidos):\n${schemaHint}\n\nProdutos com atributos em branco:\n${targetsHint}\n\nPara cada produto, proponha valor para os atributos faltando, escolhendo SOMENTE entre os valores permitidos do esquema daquela categoria.\nSe o nome não permitir deduzir com segurança, devolva null no valor e confidence abaixo de 60.\nEscreva também uma descrição comercial curta em português (máximo 18 palavras).\nDevolva JSON:\n{"items":[{"sku":"...","filled":{"atributo":"valor ou null"},"description":"...","confidence":0-100,"reason":"uma frase curta"}]}`,
    maxTokens: 1800,
  });
}

async function forecastReplenishmentActionImpl(
  base: { sku: string; name: string; attrs: Record<string, string>; category: string; stock: number; sold_30d: number; lead_time_days: number; suggest_qty: number }[],
) {
  const hint = base
    .map((p) => `${p.sku} | ${p.name} ${Object.values(p.attrs || {}).join(" ")} | categoria ${p.category} | saldo ${p.stock} | media30 ${(p.sold_30d / 30).toFixed(1)} | prazo ${p.lead_time_days}d | ingenua ${p.suggest_qty}`)
    .join("\n");
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return runAiOp({
    opId: "forecast",
    minLevel: 2,
    system: "Você é analista de reposição de estoque no varejo brasileiro. Ajusta a sugestão de compra considerando sazonalidade, tendência e calendário comercial.",
    prompt: `Data de hoje: ${today}. A sugestão ingênua atual = velocidade de venda de 30 dias ajustada pelo prazo do fornecedor. Ela ignora sazonalidade e tendência.\n\nProdutos a repor (saldo atual, média de venda em 30 dias, prazo do fornecedor em dias, sugestão ingênua):\n${hint}\n\nPara cada SKU, proponha a quantidade ajustada e explique. Considere Black Friday (novembro), Natal, volta às aulas, e o clima de primavera/verão no hemisfério sul.\nDevolva JSON:\n{"items":[{"sku":"...","suggested":numero,"deltaPct":numero,"confidence":0-100,\n "drivers":["fator 1","fator 2","fator 3"],"risk":"o que acontece se errar, uma frase curta"}]}`,
    maxTokens: 1800,
  });
}

const OCR_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const OCR_MAX_BYTES = 3.5 * 1024 * 1024;

// Nota fiscal por texto colado, foto ou PDF (DANFE). O catálogo usado para
// casar SKUs é lido aqui no servidor, não recebido do navegador.
async function extractInvoiceActionImpl(form: FormData) {
  const text = String(form.get("text") ?? "").trim();
  const file = form.get("file");

  let attachment: AiAttachment | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > OCR_MAX_BYTES) throw new UserFacingError("Arquivo maior que 3,5 MB. Envie uma foto menor ou o PDF da nota.");
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") {
      attachment = { kind: "pdf", data };
    } else if ((OCR_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      attachment = { kind: "image", mediaType: file.type as (typeof OCR_IMAGE_TYPES)[number], data };
    } else {
      throw new UserFacingError("Formato não aceito. Envie foto (JPG, PNG, WEBP) ou PDF.");
    }
  } else if (!text) {
    throw new UserFacingError("Cole o texto da nota ou envie uma foto/PDF.");
  }

  const context = await loadOcrContext();
  const catalogueHint = context.products
    .map((p) => `${p.sku} | ${p.brand} ${p.name} | ${Object.values((p.attrs as Record<string, string>) || {}).join(" ")} | custo ~${Number(p.cost_price).toFixed(2)}`)
    .join("\n");
  const schemaHint = context.categories
    .map((c) => `${c.name} (unidade ${c.unit}): ${(c.category_attributes ?? []).map((a: { key: string; label: string; values: string[] }) => `${a.key} (${a.label}) [${a.values.join("/")}]`).join(", ")}`)
    .join("\n");
  const source = attachment
    ? `A nota fiscal está no arquivo anexo (${attachment.kind === "pdf" ? "PDF" : "foto"}).`
    : `Texto da nota fiscal:\n"""\n${text}\n"""`;

  return runAiOp({
    opId: "ocr",
    minLevel: 2,
    system: "Você lê notas fiscais brasileiras (DANFE) de entrada de mercadoria para um sistema de estoque multi-loja e devolve os itens estruturados.",
    prompt: `Catálogo atual da loja (SKU | produto | variação | custo aproximado):\n${catalogueHint}\n\nCategorias disponíveis e seus atributos:\n${schemaHint}\n\n${source}\n\nExtraia os itens. Para cada um, decida se casa com um SKU do catálogo acima ou se é produto novo.\nDevolva JSON com esta forma exata:\n{"supplier":"nome do fornecedor","doc":"numero da nota","total":numero,\n "items":[{"line":1,"description":"texto original do item","qty":numero,"unitCost":numero,\n   "match":"existing"|"new","sku":"SKU casado ou SKU sugerido","productName":"nome limpo",\n   "category":"nome da categoria","attributes":{"chave":"valor"},"confidence":0-100,\n   "reason":"por que casou ou por que é produto novo, em uma frase curta em português"}]}`,
    maxTokens: 2000,
    attachment,
  });
}

export async function askInventoryAction(question: string) {
  return asResult("ask", () => askInventoryActionImpl(question));
}

export async function classifyProductAction(input: Parameters<typeof classifyProductActionImpl>[0]) {
  return asResult("classify", () => classifyProductActionImpl(input));
}

export async function enrichCatalogAction(...args: Parameters<typeof enrichCatalogActionImpl>) {
  return asResult("enrich", () => enrichCatalogActionImpl(...args));
}

export async function forecastReplenishmentAction(base: Parameters<typeof forecastReplenishmentActionImpl>[0]) {
  return asResult("forecast", () => forecastReplenishmentActionImpl(base));
}

export async function extractInvoiceAction(form: FormData) {
  return asResult("ocr", () => extractInvoiceActionImpl(form));
}
