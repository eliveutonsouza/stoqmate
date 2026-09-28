"use client";

import * as React from "react";
import Image from "next/image";
import { I } from "@/components/icons";
import { helpMediaUrl } from "@/lib/help/media";

// Peças compartilhadas pelas duas telas da central (índice e artigo).

const READ_KEY = "stoqmate.help.read";
const READ_EVENT = "stoqmate:help-read";

function readSlugs() {
  try { return window.localStorage.getItem(READ_KEY) ?? "[]"; } catch { return "[]"; }
}
function subscribe(cb) {
  window.addEventListener("storage", cb);
  window.addEventListener(READ_EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(READ_EVENT, cb); };
}

// Artigos já abertos neste navegador — só conveniência visual da trilha.
export function useReadArticles() {
  const raw = React.useSyncExternalStore(subscribe, readSlugs, () => "[]");
  return React.useMemo(() => {
    try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
  }, [raw]);
}

export function markArticleRead(slug) {
  try {
    const list = new Set(JSON.parse(readSlugs()));
    if (list.has(slug)) return;
    list.add(slug);
    window.localStorage.setItem(READ_KEY, JSON.stringify([...list]));
    window.dispatchEvent(new Event(READ_EVENT));
  } catch { /* navegador sem storage: a trilha só não marca como lido */ }
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function PlayIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
    </svg>
  );
}

const LEVEL_LABEL = { essencial: "Essencial", avancado: "Avançado" };

export function ArticleRow({ article, onOpen, read = false, last = false }) {
  return (
    <button
      onClick={() => onOpen(article.slug)}
      data-help-article={article.slug}
      style={{
        display: "flex", gap: 13, alignItems: "flex-start", width: "100%", textAlign: "left",
        padding: "14px 18px", background: "transparent", border: "none",
        borderBottom: last ? "none" : "1px solid var(--line-soft)", cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ color: read ? "var(--success)" : "var(--accent-text)", flexShrink: 0, marginTop: 2 }}>
        {read ? <I.Check size={14} stroke={2.4} /> : article.video ? <PlayIcon size={14} /> : <I.Book size={14} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.008em" }}>{article.title}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--fg-muted)", marginTop: 3, lineHeight: 1.5 }}>{article.summary}</span>
        <span style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
          {article.video && <span className="badge badge-accent">Vídeo{article.video.seconds ? ` · ${formatDuration(article.video.seconds)}` : ""}</span>}
          <span className="badge">{article.steps.length} {article.steps.length === 1 ? "passo" : "passos"}</span>
          {article.level === "avancado" && <span className="badge">{LEVEL_LABEL.avancado}</span>}
        </span>
      </span>
      <I.ChevronRight size={14} style={{ color: "var(--fg-muted)", flexShrink: 0, marginTop: 3 }} />
    </button>
  );
}

export { LEVEL_LABEL };

// Captura com o retângulo de destaque desenhado por cima (em % da imagem).
export function ShotFigure({ shot, onZoom = undefined }) {
  const f = shot.focus;
  return (
    <figure style={{ margin: 0 }}>
      <button
        type="button"
        onClick={onZoom}
        aria-label={`Ampliar: ${shot.alt}`}
        style={{ display: "block", width: "100%", padding: 0, border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "var(--bg-sunken)", cursor: onZoom ? "zoom-in" : "default", position: "relative" }}
      >
        {/* unoptimized: a mídia já sai do Storage em WebP no tamanho certo. */}
        <Image src={helpMediaUrl(shot.src)} alt={shot.alt} width={1920} height={1200} unoptimized loading="lazy" style={{ display: "block", width: "100%", height: "auto" }} />
        {f && (
          <span aria-hidden="true" style={{
            position: "absolute", left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%`,
            border: "2.5px solid var(--accent)", borderRadius: 8, boxShadow: "0 0 0 9999px rgba(20,18,13,.22)", pointerEvents: "none",
          }} />
        )}
      </button>
      <figcaption style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 6 }}>{shot.alt}</figcaption>
    </figure>
  );
}
