-- Bug real achado ao testar a Fase 7 (AIQuotaCard real): tenants.plan_id
-- nunca teve FK pra plans.id — a tabela plans só nasceu na Fase 10, bem
-- depois de tenants (Fase 1), e nenhuma migration fechou esse laço. Sem FK,
-- o PostgREST não consegue montar um embed (`plan:plans(...)`) entre as
-- duas tabelas — é exatamente isso que quebrou `loadAiQuota()`. Nenhum
-- tenant tinha plan_id órfão (conferido antes desta migration), então o
-- constraint entra sem risco de quebrar dado existente.
alter table public.tenants
  add constraint tenants_plan_id_fkey foreign key (plan_id) references public.plans(id);
