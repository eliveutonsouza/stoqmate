-- fn_write_ai_usage tinha duas assinaturas (7 e 8 args); o app só usa a de 8
-- (com p_latency_ms). A antiga deixava a chamada ambígua no PostgREST se um
-- dia alguém omitisse p_latency_ms.
drop function if exists public.fn_write_ai_usage(text, text, integer, integer, numeric, text, text);

-- fn_notify_low_stock é interna (chamada de dentro das funções de estoque);
-- não precisa ser executável pelo cliente.
revoke execute on function public.fn_notify_low_stock(uuid, uuid, uuid, integer, integer, integer) from authenticated;
