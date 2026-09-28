import { describe, it, expect } from "vitest";
import { HELP_ARTICLES } from "./articles";
import { HELP_MODULES } from "./modules";
import { TRAILS, visibleArticles, trailFor } from "./access";
import { hasShot } from "./shots";
import { ROUTE_AREA, OPEN_ROUTES, ROLES } from "@/lib/permissions";

// Integridade do conteúdo: o que quebraria a central em produção sem erro de
// tipo (slug repetido, link para artigo que não existe, tela que não existe,
// captura que não foi gerada).
const slugs = HELP_ARTICLES.map((a) => a.slug);
const known = (r: string) => r in ROUTE_AREA || OPEN_ROUTES.includes(r);

describe("conteúdo da central de ajuda", () => {
  it("slugs únicos e em kebab-case", () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it("todo artigo pertence a um módulo existente e tem ao menos um passo", () => {
    const ids = new Set(HELP_MODULES.map((m) => m.id));
    HELP_ARTICLES.forEach((a) => {
      expect(ids.has(a.module), a.slug).toBe(true);
      expect(a.steps.length, a.slug).toBeGreaterThan(0);
      expect(a.requires.length, a.slug).toBeGreaterThan(0);
    });
  });

  it("telas citadas existem na tabela de permissões", () => {
    HELP_ARTICLES.forEach((a) => {
      a.requires.forEach((r) => expect(known(r.route), `${a.slug} → ${r.route}`).toBe(true));
      if (a.openRoute) expect(known(a.openRoute), `${a.slug} → ${a.openRoute}`).toBe(true);
    });
  });

  it("relacionados e trilhas apontam para artigos existentes", () => {
    HELP_ARTICLES.forEach((a) => (a.related ?? []).forEach((r) => expect(slugs, `${a.slug} → ${r}`).toContain(r)));
    Object.values(TRAILS).flat().forEach((s) => expect(slugs).toContain(s));
  });

  it("toda captura citada foi gerada (shots.json)", () => {
    HELP_ARTICLES.forEach((a) => a.steps.forEach((s) => {
      if (s.shot) expect(hasShot(s.shot.src.replace(/^shots\/|\.webp$/g, "")), `${a.slug}: ${s.shot.src}`).toBe(true);
    }));
  });

  it("cada perfil tem uma trilha de pelo menos 5 artigos e conteúdo proporcional ao acesso", () => {
    const counts = Object.fromEntries(ROLES.map((r: { id: string }) => [r.id, visibleArticles(r.id, HELP_ARTICLES).length]));
    ROLES.forEach((r: { id: string }) => expect(trailFor(r.id, HELP_ARTICLES).length, r.id).toBeGreaterThanOrEqual(5));
    expect(counts.vendedor).toBeLessThan(counts.estoquista);
    expect(counts.proprietario).toBe(HELP_ARTICLES.length);
  });

  it("datas de atualização válidas", () => {
    HELP_ARTICLES.forEach((a) => expect(a.updatedAt, a.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });
});
