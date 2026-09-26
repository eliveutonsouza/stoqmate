// Erro do banco → mensagem pro usuário. Antes as actions devolviam
// `error.message` cru do Postgres/PostgREST ("duplicate key value violates
// unique constraint …", "new row violates row-level security policy …") —
// texto em inglês, técnico e que expõe nome de tabela/constraint.
//
// Ordem: mapa específico da tela (`known`, casado por trecho da mensagem)
// → código do Postgres → exceção levantada pelas nossas funções SQL (P0001,
// já escritas em pt-BR pra pessoa) → genérico. O erro cru vai pro log do
// servidor com contexto, nunca pra tela.

export type DbErrorLike = { message?: string; code?: string } | null | undefined;

export const GENERIC_ERROR = "Não foi possível concluir agora. Tente de novo em instantes.";
export const PERMISSION_ERROR = "Seu perfil não tem permissão para essa operação.";

const BY_CODE: Record<string, string> = {
  "42501": PERMISSION_ERROR,
  "23505": "Já existe um registro com esses dados.",
  "23503": "Este registro está ligado a outros dados e não pode ser alterado ou excluído.",
  "23514": "Algum valor informado é inválido.",
  "23502": "Preencha todos os campos obrigatórios.",
  "22P02": "Algum valor informado é inválido.",
  "22003": "Algum valor informado está fora do limite permitido.",
  "22001": "Algum texto informado é longo demais.",
  // Supabase Auth (AuthError.code)
  weak_password: "Senha fraca: use pelo menos 8 caracteres, misturando letras e números.",
  same_password: "A nova senha precisa ser diferente da atual.",
  user_already_exists: "Este email já está cadastrado.",
  email_exists: "Este email já está cadastrado.",
  email_address_invalid: "Email inválido.",
  email_not_confirmed: "Confirme seu email antes de continuar.",
  invalid_credentials: "Email ou senha incorretos.",
  otp_expired: "Código ou link expirado. Peça um novo.",
  mfa_verification_failed: "Código inválido ou expirado.",
  reauthentication_needed: "Por segurança, entre de novo antes de fazer essa alteração.",
  over_email_send_rate_limit: "Muitas tentativas. Espere um minuto e tente de novo.",
  over_request_rate_limit: "Muitas tentativas. Espere um minuto e tente de novo.",
};

function sentence(text: string) {
  const t = text.trim();
  if (!t) return GENERIC_ERROR;
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

export function userMessage(error: DbErrorLike, context: string, known: Record<string, string> = {}): string {
  const message = error?.message ?? "";
  for (const [key, friendly] of Object.entries(known)) {
    if (message.includes(key)) return friendly;
  }
  console.error(`[${context}]`, { code: error?.code, message });
  if (message.includes("not authorized") || message.includes("row-level security") || message.includes("permission denied")) {
    return PERMISSION_ERROR;
  }
  if (error?.code && BY_CODE[error.code]) return BY_CODE[error.code];
  // raise exception das nossas funções: mensagem já pensada pro usuário.
  if (error?.code === "P0001") return sentence(message);
  return GENERIC_ERROR;
}
