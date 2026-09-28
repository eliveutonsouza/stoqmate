// Mídia da central de ajuda fica no bucket público `help-media` do Supabase
// Storage. O prefixo de versão entra no caminho para invalidar cache de CDN
// quando os vídeos/capturas são regerados (scripts/help-media).
export const HELP_MEDIA_VERSION = "v1";

export function helpMediaUrl(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""): string {
  const root = base.replace(/\/+$/, "");
  const clean = path.replace(/^\/+/, "");
  return `${root}/storage/v1/object/public/help-media/${HELP_MEDIA_VERSION}/${clean}`;
}
