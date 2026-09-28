import "server-only";
import { loadStoreShell } from "@/features/shell/queries";
import { HELP_ARTICLES } from "@/lib/help/articles";
import { HELP_MODULES } from "@/lib/help/modules";
import { findArticle, relatedFor, trailFor, visibleArticles } from "@/lib/help/access";

// A central de ajuda filtra NO SERVIDOR: artigos de outros perfis nem chegam
// ao navegador. O perfil vem do mesmo loader do layout (cacheado por request).
export async function loadHelpScreen(slug: string | undefined) {
  const shell = await loadStoreShell();
  const roleId = shell?.user.roleId ?? null;
  const articles = visibleArticles(roleId, HELP_ARTICLES);
  const article = slug ? findArticle(slug, roleId, HELP_ARTICLES) : null;
  return {
    roleName: shell?.user.role ?? "",
    modules: HELP_MODULES.filter((m) => articles.some((a) => a.module === m.id)),
    articles,
    trail: trailFor(roleId, HELP_ARTICLES).map((a) => a.slug),
    article,
    related: article ? relatedFor(article, roleId, HELP_ARTICLES) : [],
    missing: Boolean(slug) && !article,
  };
}

export type HelpScreen = Awaited<ReturnType<typeof loadHelpScreen>>;
