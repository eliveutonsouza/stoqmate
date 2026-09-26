// Validação de entrada nas server actions. O cliente já valida pra dar
// feedback rápido, mas action é endpoint público (qualquer um chama com
// fetch) — a regra que vale é a daqui.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim());
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
// CNPJ com dígitos verificadores (aceita com ou sem máscara).
export function isCnpj(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const d = v.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const digit = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((s, w, i) => s + w * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return digit(12) === Number(d[12]) && digit(13) === Number(d[13]);
}

// 11222333000181 → 11.222.333/0001-81 (assume CNPJ já validado).
export const formatCnpj = (v: string) =>
  v.replace(/\D/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

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
