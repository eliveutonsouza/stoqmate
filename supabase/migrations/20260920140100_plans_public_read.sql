-- Bug real achado ao testar a Fase 7 (renovação de crédito): `plans` só
-- tinha RLS pra platform_staff (plans_staff_all). Qualquer tenant comum
-- (não-staff) lendo a própria assinatura ou a própria cota de IA batia
-- nessa tabela e não via NADA — RLS bloqueava mesmo com o grant de select
-- já concedido a `authenticated`. Preço de plano não é dado sensível
-- (a mesma tabela já é pública em /pricing, só que hoje via mock); todo
-- usuário autenticado passa a poder ler plano ativo.
create policy plans_select_active on public.plans
  for select to authenticated
  using (active);
