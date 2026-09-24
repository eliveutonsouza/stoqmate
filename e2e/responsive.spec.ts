import { test, expect, type Page } from "@playwright/test";
import { listRoutes } from "./route-list";

// Roda nos projetos "mobile" e "tablet" (playwright.config.ts). Checa que
// nada da página passa da largura da viewport. O shell do app rola dentro
// de [data-content-area], então document.scrollWidth não pega o estouro —
// o critério é: elemento além da viewport só é aceitável dentro de um
// scroller horizontal legítimo (tabela, abas, chips) que caiba na tela.
async function overflowingElements(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const found: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.right <= vw + 1) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.closest(".app-sidebar") && !el.closest('[data-drawer="open"]')) continue;
      const film = el.closest('[data-testid="hero-film"]');
      if (film && film !== el) continue;
      let legit = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.hasAttribute("data-content-area")) break;
        if (/(auto|scroll)/.test(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right <= vw + 1) {
          legit = true;
          break;
        }
      }
      if (legit) continue;
      const cls = typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "";
      found.push(`${el.tagName.toLowerCase()}${cls} (right=${Math.round(b.right)}) "${(el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`);
      if (found.length >= 3) break;
    }
    return found;
  });
}

for (const route of listRoutes()) {
  test(`rota ${route} não estoura a largura da tela`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    expect(await overflowingElements(page)).toEqual([]);
  });
}
