-- /pricing mostrava preços de pacote de crédito fixos no código (R$ 29/49/
-- 129) enquanto o checkout cobra o que está em credit_packs. A página é
-- pública (visitante sem sessão), então o anon precisa ler os pacotes
-- ativos — mesmo tratamento de plans (20260923010000). Só leitura.
create policy credit_packs_select_public on public.credit_packs
  for select to anon using (active);
grant select on public.credit_packs to anon;
