import { matchesSignature } from "@/lib/file-sniff";

// Regras de upload de imagem — espelham os limites dos buckets
// (migration 20260924220300_storage_limits). Checar aqui dá mensagem clara
// antes do storage recusar com erro genérico.

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function checkImage(file: unknown, maxMb: number): Promise<{ error: string } | { ext: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "Nenhum arquivo enviado." };
  const ext = EXT[file.type];
  if (!ext) return { error: "Formato não aceito. Envie JPG, PNG ou WEBP." };
  if (file.size > maxMb * 1024 * 1024) return { error: `Arquivo maior que ${maxMb} MB.` };
  // Bucket público: um HTML renomeado pra .png seria servido do nosso domínio.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(head, file.type)) return { error: "O arquivo não é uma imagem JPG, PNG ou WEBP válida." };
  return { ext };
}

// Nome gerado no servidor: o nome original do arquivo nunca entra no path.
export function uploadPath(prefix: string, ext: string) {
  return `${prefix}/${crypto.randomUUID()}.${ext}`;
}
