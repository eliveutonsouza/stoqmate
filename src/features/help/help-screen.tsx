import { HelpCenter } from "./help-center";
import { HelpArticleView } from "./help-article";
import { loadHelpScreen } from "./queries";

// /help e /help?artigo=<slug>: mesma rota, sem segmento dinâmico (ver
// .spec/routing.md). Escolhe entre o índice e o artigo já filtrados por perfil.
export async function HelpScreen({ artigo }: { artigo?: string }) {
  const screen = await loadHelpScreen(artigo);
  if (screen.article) {
    const helpModule = screen.modules.find((m) => m.id === screen.article?.module);
    return <HelpArticleView article={screen.article} module={helpModule} related={screen.related} />;
  }
  return <HelpCenter roleName={screen.roleName} modules={screen.modules} articles={screen.articles} trail={screen.trail} missing={screen.missing} />;
}
