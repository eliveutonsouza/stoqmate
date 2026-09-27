-- Pós-deploy de 20260928120000: o console já manda p_trial_ai_credits; a
-- assinatura antiga (3 parâmetros) sai pra não sobrar um caminho que ignora
-- o teto de IA do trial.
drop function if exists public.fn_platform_settings_update(integer, numeric, integer);
