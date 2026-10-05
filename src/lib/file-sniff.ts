// Conferência pelo conteúdo, não pelo tipo que o navegador declarou: o
// `File.type` é só o que o cliente disse (e o bucket confere esse mesmo
// valor). Os primeiros bytes de cada formato aceito são fixos.
const SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // RIFF....WEBP
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
};

export function matchesSignature(bytes: Uint8Array, declaredType: string): boolean {
  const sigs = SIGNATURES[declaredType];
  if (!sigs) return false;
  const ok = sigs.some((sig) => sig.every((b, i) => bytes[i] === b));
  if (!ok) return false;
  if (declaredType === "image/webp") {
    return String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return true;
}

// Páginas de um PDF pelo maior `/Count` da árvore de páginas. Em PDF com
// object streams comprimidos o número não aparece em texto: devolve null
// (desconhecido) e quem chama decide — aqui o teto de bytes continua valendo.
export function pdfPageCount(bytes: Uint8Array): number | null {
  const text = new TextDecoder("latin1").decode(bytes);
  let max: number | null = null;
  for (const m of text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)) {
    const n = Number(m[1] ?? m[2]);
    if (Number.isFinite(n)) max = Math.max(max ?? 0, n);
  }
  return max;
}
