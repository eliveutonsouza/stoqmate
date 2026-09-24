-- Páginas públicas (landing, /pricing, /signup, /checkout) passam a ler o
-- catálogo real editado em /admin/plans em vez do PLANS estático. Visitante
-- não tem sessão, então precisa de policy + grant pro anon — só planos
-- ativos, e só leitura.
create policy plans_select_public on public.plans
  for select to anon using (active);
grant select on public.plans to anon;

-- Duração real do trial pra copy pública ("14 dias grátis"). A tabela
-- platform_settings continua só-staff; o anon lê só este número.
grant execute on function public.fn_platform_trial_days() to anon, authenticated;
