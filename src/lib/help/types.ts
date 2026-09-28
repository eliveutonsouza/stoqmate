// Base de conhecimento (/help): o formato de cada artigo. Conteúdo é dado
// estático versionado no repo — como PLANS em lib/plans.js — e a visibilidade
// sai da mesma tabela de permissões do app (lib/permissions.js).

export type HelpModuleId =
  | "primeiros-passos"
  | "configuracao"
  | "catalogo"
  | "vendas"
  | "estoque"
  | "compras"
  | "promocoes"
  | "ia"
  | "relatorios"
  | "financeiro"
  | "administracao";

export type HelpModule = {
  id: HelpModuleId;
  title: string;
  desc: string;
  icon: string; // chave de `I` em components/icons
};

export type AccessLevel = "view" | "edit" | "full";

// Retângulo de destaque em % da captura (0–100), desenhado por cima da imagem.
export type HelpFocus = { x: number; y: number; w: number; h: number };

export type HelpShot = {
  src: string; // caminho relativo no bucket help-media (ex.: "shots/estoque-entrada-1.webp")
  alt: string;
  focus?: HelpFocus;
};

export type HelpStep = {
  title: string;
  body: string;
  shot?: HelpShot;
  tip?: string;
  warn?: string;
};

export type HelpVideo = {
  key: string; // videos/<key>.mp4, .vtt e .jpg no bucket
  seconds: number;
};

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  module: HelpModuleId;
  level: "essencial" | "avancado";
  // O artigo só aparece para quem alcança TODAS estas telas no nível pedido.
  requires: { route: string; level?: AccessLevel }[];
  openRoute?: string; // "Abrir esta tela"
  video?: HelpVideo;
  intro?: string;
  steps: HelpStep[];
  faq?: { q: string; a: string }[];
  related?: string[];
  keywords?: string[];
  updatedAt: string; // AAAA-MM-DD
};
