-- Bug real achado ao testar o AIQuotaCard: ai_ops tem RLS ligado (Supabase
-- liga por padrão em tabela nova) mas a migration original só concedeu
-- `grant select ... to authenticated` — grant sem policy, com RLS ligado,
-- é "nega tudo". Resultado: todo tenant autenticado via 0 linhas em
-- ai_ops sem erro nenhum, e "onde os créditos foram" ficava sempre vazio
-- mesmo com uso real registrado. ai_ops é tabela de referência (nome e
-- custo de cada operação de IA), não é dado de tenant — todo usuário
-- autenticado pode ler.
alter table public.ai_ops enable row level security;

create policy ai_ops_select_all on public.ai_ops
  for select to authenticated
  using (true);
