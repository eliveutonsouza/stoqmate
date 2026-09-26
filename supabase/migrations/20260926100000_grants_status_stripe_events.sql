-- Auditoria rodada 2 — ajustes de contrato banco × app.
--
-- 1. fn_write_ai_usage (8 args, de 20260920150000) só tinha execute por
--    default privileges do banco remoto; o grant explícito era da versão de
--    7 args, já dropada. Formaliza pra um banco novo não quebrar o log de IA.
-- 2. subscription_status não tinha 'paused' — o Stripe manda esse status
--    quando a assinatura é pausada; o upsert do webhook falhava (500) e o
--    Stripe re-tentava pra sempre.
-- 3. stripe_events: idempotência por event.id no webhook (reentrega do
--    Stripe não reprocessa). Só service_role toca; RLS ligada sem policy.

grant execute on function public.fn_write_ai_usage(text, text, integer, integer, numeric, text, text, integer) to authenticated;

alter type public.subscription_status add value if not exists 'paused';

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
grant select, insert, delete on public.stripe_events to service_role;
