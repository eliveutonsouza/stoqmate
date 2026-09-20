-- Bug real e sério, achado pela auditoria de RLS que o gap do ai_ops
-- motivou: platform_staff tinha RLS ligado e ZERO policy — igual ao
-- ai_ops, grant sem policy com RLS ligado nega tudo silenciosamente.
-- Isso quebrava DE VERDADE o login admin: signInAdminAction
-- (src/features/auth/actions.ts) confere se o usuário é staff consultando
-- platform_staff com o client normal (RLS-scoped) — sempre voltava 0
-- linhas, então TODO login em /login/admin era recusado com "esta conta
-- não tem acesso", mesmo pra staff real. Mesma tabela também é lida em
-- invitePlatformStaffAction pra checar se quem chama já é super_admin —
-- também sempre falhava (fail-safe, mas quebrado).
--
-- Policy mínima: staff só enxerga a PRÓPRIA linha via RLS — a listagem
-- completa de staff (tela /admin/users) já usa corretamente o
-- service_role client depois de confirmar is_platform_staff(), não muda.
create policy platform_staff_select_own on public.platform_staff
  for select to authenticated
  using (user_id = auth.uid());
