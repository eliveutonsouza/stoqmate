import type { HelpArticle } from "./types";
import { PRIMEIROS_PASSOS } from "./content/primeiros-passos";
import { CONFIGURACAO } from "./content/configuracao";
import { CATALOGO } from "./content/catalogo";
import { VENDAS } from "./content/vendas";
import { ESTOQUE } from "./content/estoque";
import { COMPRAS, PROMOCOES, IA } from "./content/compras-promocoes-ia";
import { RELATORIOS, FINANCEIRO, ADMINISTRACAO } from "./content/relatorios-financeiro-admin";

// Todos os artigos da central de ajuda, na ordem dos módulos. A visibilidade
// por perfil é decidida em access.ts — nunca filtre aqui.
export const HELP_ARTICLES: HelpArticle[] = [
  ...PRIMEIROS_PASSOS,
  ...CONFIGURACAO,
  ...CATALOGO,
  ...VENDAS,
  ...ESTOQUE,
  ...COMPRAS,
  ...PROMOCOES,
  ...IA,
  ...RELATORIOS,
  ...FINANCEIRO,
  ...ADMINISTRACAO,
];
