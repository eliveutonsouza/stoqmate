"use client";

import * as React from "react";
import Image from "next/image";
import { useNavigate } from "@/hooks/use-navigate";
import { StoreShell } from "@/components/ui/store-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Page } from "@/components/ui/page-container";
import { I } from "@/components/icons";
import { HubCard } from "@/components/domain/hub-card";
import { SUPPORT_EMAIL } from "@/lib/support";
import { groupByModule, searchArticles } from "@/lib/help/access";
import { helpMediaUrl } from "@/lib/help/media";
import { ArticleRow, PlayIcon, formatDuration, useReadArticles } from "./help-parts";

const Icon = ({ name, size = 17 }) => {
  const Ico = I[name] ?? I.Box;
  return <Ico size={size} />;
};

export function HelpCenter({ roleName, modules, articles, trail, missing }) {
  const navigate = useNavigate();
  const read = useReadArticles();
  const [query, setQuery] = React.useState("");
  const [moduleId, setModuleId] = React.useState(null);

  const open = (slug) => navigate(`/help?artigo=${slug}`);
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const trailArticles = trail.map((s) => bySlug.get(s)).filter(Boolean);
  const trailDone = trailArticles.filter((a) => read.has(a.slug)).length;
  const videos = articles.filter((a) => a.video);
  const results = query.trim() ? searchArticles(query, articles) : null;
  const groups = groupByModule(modules, articles);
  const activeGroup = moduleId ? groups.find((g) => g.module.id === moduleId) : null;

  return (
    <StoreShell breadcrumb={["Ajuda"]} navigate={navigate}>
      <PageHeader
        title="Central de ajuda"
        sub={`Vídeos, passo a passo e respostas sobre o Stoqmate — só o que o seu perfil${roleName ? ` (${roleName})` : ""} usa no dia a dia.`}
        actions={(
          <>
            <button onClick={() => navigate("/first-run")} className="btn btn-outline btn-sm">Primeiros passos</button>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary btn-sm">Falar com o suporte</a>
          </>
        )}
      />
      <Page gap={22} width={1060}>
        {missing && (
          <div role="alert" className="card" style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderColor: "var(--warning)", background: "var(--warning-soft)" }}>
            <I.Alert size={15} />
            <span style={{ fontSize: 13 }}>Artigo não encontrado. Ele pode ter mudado de nome ou não fazer parte do seu perfil — busque abaixo.</span>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)" }}>
            <I.Search size={16} />
          </span>
          <input
            className="input"
            type="search"
            aria-label="Buscar na central de ajuda"
            placeholder="Como faço para… (ex.: transferir entre lojas, fechar o caixa)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42, height: 46, fontSize: 15 }}
          />
        </div>

        {results ? (
          <section aria-label="Resultados da busca">
            <div className="section-h"><h3>{results.length} {results.length === 1 ? "resultado" : "resultados"}</h3></div>
            <div className="card" style={{ overflow: "hidden" }}>
              {results.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
                  Nada encontrado para &ldquo;{query}&rdquo;. Tente outra palavra ou fale com o suporte.
                </div>
              ) : results.map((a, i) => <ArticleRow key={a.slug} article={a} onOpen={open} read={read.has(a.slug)} last={i === results.length - 1} />)}
            </div>
          </section>
        ) : activeGroup ? (
          <section aria-label={activeGroup.module.title}>
            <div className="section-h" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setModuleId(null)} className="btn btn-ghost btn-sm"><I.ChevronLeft size={13} /> Todos os assuntos</button>
              <h3 style={{ margin: 0 }}>{activeGroup.module.title}</h3>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {activeGroup.articles.map((a, i) => <ArticleRow key={a.slug} article={a} onOpen={open} read={read.has(a.slug)} last={i === activeGroup.articles.length - 1} />)}
            </div>
          </section>
        ) : (
          <>
            {trailArticles.length > 0 && (
              <section aria-label="Comece por aqui" className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Comece por aqui</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--fg-muted)" }}>A trilha essencial para {roleName ? `o perfil ${roleName}` : "o seu perfil"}, na ordem certa.</p>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: "var(--fg-muted)" }}>{trailDone} de {trailArticles.length} lidos</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: "var(--bg-sunken)", marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: `${(trailDone / trailArticles.length) * 100}%`, height: "100%", background: "var(--accent)", transition: "width .3s" }} />
                </div>
                <ol className="g2" style={{ listStyle: "none", padding: 0, margin: "14px 0 0", gap: 8 }}>
                  {trailArticles.map((a, i) => {
                    const done = read.has(a.slug);
                    return (
                      <li key={a.slug}>
                        <button onClick={() => open(a.slug)} data-help-article={a.slug} className="card" style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "10px 12px", cursor: "pointer", background: done ? "var(--bg-sunken)" : "var(--bg-elev)" }}>
                          <span className="mono" aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, background: done ? "var(--success-soft)" : "var(--accent-soft)", color: done ? "var(--success)" : "var(--accent-text)" }}>
                            {done ? <I.Check size={12} stroke={2.6} /> : i + 1}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500 }} className="truncate">{a.title}</span>
                          {a.video && <span style={{ color: "var(--fg-muted)" }}><PlayIcon size={12} /></span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {videos.length > 0 && (
              <section aria-label="Tutoriais em vídeo">
                <div className="section-h"><h3>Tutoriais em vídeo</h3></div>
                <div className="g3" style={{ gap: 12 }}>
                  {videos.map((a) => (
                    <button key={a.slug} onClick={() => open(a.slug)} data-help-article={a.slug} className="card" style={{ padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ display: "block", position: "relative", aspectRatio: "16 / 9", background: "var(--bg-sunken)" }}>
                        <Image src={helpMediaUrl(`videos/${a.video.key}.jpg`)} alt="" fill sizes="(max-width: 640px) 100vw, 340px" style={{ objectFit: "cover" }} />
                        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ width: 42, height: 42, borderRadius: 21, background: "rgba(20,18,13,.72)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 3 }}>
                            <PlayIcon size={18} />
                          </span>
                        </span>
                        {a.video.seconds > 0 && (
                          <span className="mono" style={{ position: "absolute", right: 8, bottom: 8, fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(20,18,13,.78)", color: "#fff" }}>
                            {formatDuration(a.video.seconds)}
                          </span>
                        )}
                      </span>
                      <span style={{ display: "block", padding: "10px 12px 12px" }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{a.title}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--fg-muted)", marginTop: 3, lineHeight: 1.45 }}>{a.summary}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section aria-label="Por assunto">
              <div className="section-h"><h3>Por assunto</h3></div>
              <div className="g3" style={{ gap: 12 }}>
                {groups.map(({ module: m, articles: list }) => (
                  <button key={m.id} onClick={() => setModuleId(m.id)} data-help-module={m.id} className="card" style={{ padding: 16, textAlign: "left", cursor: "pointer" }}>
                    <span style={{ color: "var(--fg-muted)", display: "flex" }}><Icon name={m.icon} /></span>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 11, letterSpacing: "-0.01em" }}>{m.title}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--fg-muted)", marginTop: 4, lineHeight: 1.5 }}>{m.desc}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--accent-text)", marginTop: 8 }}>
                      {list.length} {list.length === 1 ? "artigo" : "artigos"}{list.some((a) => a.video) ? " · com vídeo" : ""} →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="g2" style={{ gap: 12 }}>
          <HubCard icon={<I.Users size={15} />} title="Não achou a resposta?" desc={`Escreva para ${SUPPORT_EMAIL} com a sua dúvida — responda com prints se puder.`} accent onClick={() => window.location.assign(`mailto:${SUPPORT_EMAIL}`)} />
          <HubCard icon={<I.Sparkle size={15} />} title="Migração assistida" desc="Peça ajuda por email para importar seu catálogo." accent onClick={() => window.location.assign(`mailto:${SUPPORT_EMAIL}?subject=Migra%C3%A7%C3%A3o%20assistida`)} />
        </div>
      </Page>
    </StoreShell>
  );
}
