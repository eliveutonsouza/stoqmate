// Mídia da central de ajuda fica no bucket público `help-media` do Supabase
// Storage. O prefixo de versão entra no caminho para invalidar cache de CDN
// quando os vídeos/capturas são regerados (scripts/help-media).
export const HELP_MEDIA_VERSION = "v1";

export function helpMediaUrl(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""): string {
  const root = base.replace(/\/+$/, "");
  const clean = path.replace(/^\/+/, "");
  return `${root}/storage/v1/object/public/help-media/${HELP_MEDIA_VERSION}/${clean}`;
}

// Vídeos publicados no YouTube (não listados), por `video.key` do artigo.
// Artigo com id aqui toca pelo YouTube (streaming adaptativo, CDN deles);
// sem id, cai no mp4 do bucket acima.
export const HELP_YOUTUBE_IDS: Record<string, string> = {
  tour: "D8157rv8cCA",
  onboarding: "w24DgfIV9Bw",
  equipe: "BZGzkQxCMNQ",
  produto: "qW08VZxi83w",
  importar: "4KLCipR0NnA",
  pdv: "rAOZYXECAY0",
  venda: "BnvtkRI29ys",
  entrada: "7WKFOCbCu1A",
  transferencia: "sBCHyFvmxN4",
  reposicao: "sW_pBs5cVeM",
  // caixa, categorias, contagem: ainda no mp4 do bucket.
};

export function helpYoutubeId(key: string): string | null {
  return HELP_YOUTUBE_IDS[key] ?? null;
}
