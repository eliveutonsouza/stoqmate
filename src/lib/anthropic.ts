import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada.");
  return new Anthropic({ apiKey: key });
}

// Espelha o contrato de window.claude.complete() (que só existe no harness
// de dev do Artifact) com uma chamada real à API da Anthropic. O modelo é
// instruído a responder só com o JSON — sem isso ele intercala texto antes/
// depois do bloco e quebra o JSON.parse.
export async function aiCompleteJSON({
  system,
  prompt,
  maxTokens = 1500,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}) {
  const client = getAnthropic();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: `${system}\n\nResponda APENAS com o JSON pedido, sem texto antes ou depois, sem markdown.`,
    messages: [{ role: "user", content: prompt }],
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

  return {
    data,
    model: MODEL,
    tokensIn: message.usage.input_tokens,
    tokensOut: message.usage.output_tokens,
  };
}
