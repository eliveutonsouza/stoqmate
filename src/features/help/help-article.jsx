"use client";

import * as React from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { StoreShell } from "@/components/ui/store-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Page } from "@/components/ui/page-container";
import { Modal } from "@/components/ui/modal";
import { I } from "@/components/icons";
import { helpMediaUrl } from "@/lib/help/media";
import { ArticleRow, LEVEL_LABEL, ShotFigure, formatDuration, markArticleRead, useReadArticles } from "./help-parts";

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

function Callout({ tone, children }) {
  const tip = tone === "tip";
  return (
    <div style={{
      display: "flex", gap: 9, padding: "10px 12px", borderRadius: 8, fontSize: 12.5, lineHeight: 1.55,
      background: tip ? "var(--info-soft)" : "var(--warning-soft)",
      border: `1px solid ${tip ? "var(--info)" : "var(--warning)"}`,
    }}>
      <span style={{ color: tip ? "var(--info)" : "var(--warning)", flexShrink: 0, marginTop: 1 }}>
        {tip ? <I.Sparkle size={14} /> : <I.Alert size={14} />}
      </span>
      <span><strong style={{ fontWeight: 600 }}>{tip ? "Dica: " : "Atenção: "}</strong>{children}</span>
    </div>
  );
}

export function HelpArticleView({ article, module: helpModule, related }) {
  const navigate = useNavigate();
  const read = useReadArticles();
  const [zoom, setZoom] = React.useState(null);

  // Marcar como lido é efeito colateral externo (localStorage), não estado.
  React.useEffect(() => { markArticleRead(article.slug); }, [article.slug]);

  const video = article.video;
  const open = (slug) => navigate(`/help?artigo=${slug}`);

  return (
    <StoreShell breadcrumb={["Ajuda", helpModule?.title ?? "Artigo"]} navigate={navigate}>
      <PageHeader
        title={article.title}
        sub={article.summary}
        actions={(
          <>
            <button onClick={() => navigate("/help")} className="btn btn-ghost btn-sm"><I.ChevronLeft size={13} /> Central de ajuda</button>
            {article.openRoute && (
              <button onClick={() => navigate(article.openRoute)} className="btn btn-primary btn-sm">Abrir esta tela <I.ArrowRight size={13} /></button>
            )}
          </>
        )}
      />
      <Page gap={20} width={1180}>
        <div className="split-aside" style={{ "--aside": "280px" }}>
          <article style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            {video && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <video
                  controls
                  preload="metadata"
                  playsInline
                  poster={helpMediaUrl(`videos/${video.key}.jpg`)}
                  style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "#0E0D0B" }}
                  aria-label={`Vídeo: ${article.title}`}
                >
                  <source src={helpMediaUrl(`videos/${video.key}.mp4`)} type="video/mp4" />
                  <track kind="captions" srcLang="pt-BR" label="Português" src={helpMediaUrl(`videos/${video.key}.vtt`)} default />
                  Seu navegador não reproduz vídeo. Siga o passo a passo abaixo.
                </video>
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", fontSize: 12, color: "var(--fg-muted)", borderTop: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
                  <span className="badge badge-accent">Vídeo{video.seconds ? ` · ${formatDuration(video.seconds)}` : ""}</span>
                  <span>Com narração e legenda. O mesmo conteúdo está escrito abaixo, passo a passo.</span>
                </div>
              </div>
            )}

            {article.intro && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--fg-soft)" }}>{article.intro}</p>}

            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {article.steps.map((s, i) => (
                <li key={i} id={`passo-${i + 1}`} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 80 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span className="mono" aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: "var(--accent-soft)", color: "var(--accent-text)" }}>{i + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{s.title}</h2>
                      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.65, color: "var(--fg-soft)" }}>{s.body}</p>
                    </div>
                  </div>
                  {s.shot && <ShotFigure shot={s.shot} onZoom={() => setZoom(s.shot)} />}
                  {s.tip && <Callout tone="tip">{s.tip}</Callout>}
                  {s.warn && <Callout tone="warn">{s.warn}</Callout>}
                </li>
              ))}
            </ol>

            {article.faq && article.faq.length > 0 && (
              <section aria-label="Perguntas frequentes">
                <div className="section-h"><h3>Perguntas frequentes</h3></div>
                <div className="card" style={{ overflow: "hidden" }}>
                  {article.faq.map((f, i) => (
                    <details key={f.q} style={{ padding: "12px 18px", borderBottom: i < article.faq.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                      <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 500 }}>{f.q}</summary>
                      <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--fg-muted)" }}>{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside data-sticky style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <nav aria-label="Neste artigo" className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Neste artigo</div>
              <ol style={{ margin: "10px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
                {article.steps.map((s, i) => (
                  <li key={i}><a href={`#passo-${i + 1}`} style={{ color: "var(--fg)", textDecoration: "none" }}>{s.title}</a></li>
                ))}
              </ol>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                <span className="badge">{LEVEL_LABEL[article.level]}</span>
                {helpModule && <span className="badge">{helpModule.title}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 10 }}>Atualizado em {DATE.format(new Date(`${article.updatedAt}T00:00:00Z`))}</div>
            </nav>

            {related.length > 0 && (
              <nav aria-label="Artigos relacionados" className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "12px 18px 4px", fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Relacionados</div>
                {related.map((a, i) => <ArticleRow key={a.slug} article={a} onOpen={open} read={read.has(a.slug)} last={i === related.length - 1} />)}
              </nav>
            )}
          </aside>
        </div>
      </Page>

      <Modal open={!!zoom} onClose={() => setZoom(null)} title={zoom?.alt ?? ""} width={1200}>
        {zoom && <ShotFigure shot={zoom} sizes="(max-width: 1240px) 100vw, 1200px" />}
      </Modal>
    </StoreShell>
  );
}
