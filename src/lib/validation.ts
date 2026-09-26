// Validação de entrada nas server actions. O cliente já valida pra dar
// feedback rápido, mas action é endpoint público (qualquer um chama com
// fetch) — a regra que vale é a daqui.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim());
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
export const allUuids = (v: unknown): v is string[] => Array.isArray(v) && v.every(isUuid);

// Campo de texto obrigatório com tamanho mínimo/máximo (após trim).
export function textError(value: unknown, label: string, min = 1, max = 200): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  if (t.length < min) return min <= 1 ? `Informe ${label}.` : `${label[0].toUpperCase()}${label.slice(1)} precisa ter pelo menos ${min} caracteres.`;
  if (t.length > max) return `${label[0].toUpperCase()}${label.slice(1)} pode ter no máximo ${max} caracteres.`;
  return null;
}

export function passwordError(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 8) return "A senha precisa ter no mínimo 8 caracteres.";
  if (value.length > 72) return "A senha pode ter no máximo 72 caracteres.";
  return null;
}

// URL de imagem enviada pelo nosso upload: precisa ser do Storage público
// deste projeto (bucket informado). Evita gravar link arbitrário (rastreador,
// conteúdo de terceiro) como logo/avatar.
export function isOwnStorageUrl(value: unknown, bucket: string): value is string {
  if (typeof value !== "string") return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return false;
  return value.startsWith(`${base}/storage/v1/object/public/${bucket}/`) && !value.includes("..");
}
