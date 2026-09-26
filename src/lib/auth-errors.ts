// Só credencial errada vira "senha incorreta". Qualquer outra falha (chave de
// API inválida, rede, Supabase fora) é problema nosso, não do usuário — dizer
// "senha incorreta" nesses casos esconde o incidente (ver env.ts).
type AuthErrorLike = { code?: string; status?: number } | null | undefined;

export function isInvalidCredentials(error: AuthErrorLike) {
  return error?.code === "invalid_credentials";
}

export function signInErrorMessage(error: AuthErrorLike) {
  if (isInvalidCredentials(error)) return "Email ou senha incorretos.";
  if (error?.status === 429) return "Muitas tentativas. Espere um minuto e tente de novo.";
  return "Não foi possível entrar agora. Tente de novo em instantes.";
}
