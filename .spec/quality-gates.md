# Quality gates — contrato congelado

Portões inegociáveis antes de considerar qualquer mudança pronta:

1. `npx eslint .` sai com código 0 — **zero erros, zero warnings.** As
   regras do React Compiler (`react-hooks/static-components`,
   `set-state-in-effect`, `immutability`, `purity`) são erro, não warning —
   não silenciar com `eslint-disable`, corrigir a causa (ver padrões em
   `.spec/architecture.md` e o histórico de correções desta revisão:
   componente inline definido dentro de render vira componente hoisted;
   `setState` em efeito de sincronizar prop vira ajuste durante render;
   acumulador mutado em `.map()` vira `reduce`).
2. `next build` passa limpo — build de produção, não só `next dev`.
3. `npx vitest run` verde.
4. `npx playwright test` verde.
5. `npx storybook build` sai sem erro (as ~40 stories do design system
   continuam montando).
6. `supabase db push` sai limpo contra o projeto Supabase do dev antes de
   qualquer PR que inclua migration nova — migration é contrato de schema
   agora (ver `.spec/architecture.md`, seção Backend). Verificação manual
   (ainda não em CI): rodar o push e olhar a saída, nenhum erro.
7. Migration é **append-only**: nunca editar um arquivo de migration já
   aplicado — sempre um arquivo novo com `create or replace function`/
   `alter table`. Editar uma migration aplicada quebra o histórico entre
   ambientes (dev local vs. produção) de forma silenciosa.
8. Toda função Postgres `security definer` que recebe id vindo do cliente
   valida esse id contra `auth_tenant_id()` antes de usar — ela roda com
   privilégio elevado, então pular essa checagem é abrir brecha
   cross-tenant, não atalho.
9. Toda tabela nova criada por uma migration é conferida contra o padrão
   "RLS ligado + grant concedido + zero policy = nega tudo, sem erro pro
   client" antes de dar a tabela por pronta — já mordeu duas vezes de
   verdade (`ai_ops`, `platform_staff`; ver `.spec/architecture.md`).
   Checagem manual: `select tablename, rowsecurity from pg_tables where
   schemaname='public'` cruzado com `select tablename, count(*) from
   pg_policies where schemaname='public' group by tablename` — toda
   tabela com RLS ligado precisa de policy_count > 0 OU de justificativa
   documentada de que só é lida via `service_role`.

Nenhum desses 9 pode ser pulado ou enfraquecido (ex.: reduzir regra de
erro pra warning, remover um teste que passou a falhar em vez de corrigir
o código) sem autorização explícita do desenvolvedor — ver `CLAUDE.md`.

## Follow-up já registrado (não é dívida silenciosa)

- **Ativo agora** (o Supabase já substituiu o mock por fetch real):
  reauditar `src/features/**` com a skill `vercel-react-best-practices`,
  focando em "Eliminating Waterfalls" e "Server-Side Performance" —
  `Promise.all` nas telas com múltiplas queries, `React.cache()` onde uma
  Server Action e a página que a chama pedem o mesmo dado na mesma
  requisição. Não feito nesta revisão (Fase 11 foi fechamento de spec, não
  auditoria de performance); é o próximo item de qualidade pendente.
- `.spec/design-system.md`: decisão de manter estilo inline + CSS utilitário
  em vez de Tailwind-first é deliberada, não pendência.
