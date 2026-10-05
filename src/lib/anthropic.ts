import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { TOKEN } from "@/lib/plans";

export const AI_MODEL = "claude-haiku-4-5-20251001";

// Arquivo que acompanha o prompt (foto ou PDF de nota fiscal), em base64.
export type AiAttachment =
  | { kind: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }
  | { kind: "pdf"; data: string };

export function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada.");
  // Padrão do SDK é ~10 min por tentativa + 2 retries: a função da Vercel
  // morreria antes do catch e o crédito debitado nunca seria estornado.
  // 60s × 2 tentativas fica bem dentro do limite da função e da janela de
  // estorno de fn_ai_refund_credits_for (15 min).
  return new Anthropic({ apiKey: key, timeout: 60_000, maxRetries: 1 });
}

// Espelha o contrato de window.claude.complete() (que só existe no harness
// de dev do Artifact) com uma chamada real à API da Anthropic. O modelo é
// instruído a responder só com o JSON — sem isso ele intercala texto antes/
// depois do bloco e quebra o JSON.parse.
export async function aiCompleteJSON({
  system,
  prompt,
  maxTokens = 1500,
  attachment,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
  attachment?: AiAttachment;
}) {
  const client = getAnthropic();
  const content: Anthropic.ContentBlockParam[] = [];
  if (attachment?.kind === "image") {
    content.push({ type: "image", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } });
  } else if (attachment?.kind === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: attachment.data } });
  }
  content.push({ type: "text", text: prompt });
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system: `${system}\n\nResponda APENAS com o JSON pedido, sem texto antes ou depois, sem markdown.`,
    messages: [{ role: "user", content }],
  });

  const block = message.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "";
  const jsonText = raw.startsWith("```") ? raw.replace(/^```(json)?\n?/, "").replace(/```$/, "") : raw;

  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("A IA devolveu uma resposta que não é JSON válido.");
  }

  // Mesma tabela de preço usada em src/lib/plans.js (TOKEN) — fonte única,
  // pra admin-ai-monitoring não divergir do modelo de custo do planejamento.
  const costUsd = (message.usage.input_tokens / 1_000_000) * TOKEN.in
    + (message.usage.output_tokens / 1_000_000) * TOKEN.out;

  return {
    data,
    model: AI_MODEL,
    tokensIn: message.usage.input_tokens,
    tokensOut: message.usage.output_tokens,
    costUsd,
  };
}
