"use client";

// Motor mínimo pra rodar o "filme" do hero — porta só o que hero-film-scenes.jsx
// usa do motor de autoria original (video/animations-v3.jsx no claude.ai/design).
// Fora do escopo, de propósito: exportação de vídeo, sincronização com o editor
// de timeline do host, barra de transporte, atalho de teclado, persistência em
// localStorage, kit de aquarela. Nada disso roda em produção — ver
// .spec/testing.md e o histórico do commit que trouxe este arquivo.

import * as React from 'react';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const Easing = {
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

// animate({from, to, start, end, ease})(t) — tween de um segmento só.
export function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

const FilmContext = React.createContext(null);

export function useFilmClock() {
  const ctx = React.useContext(FilmContext);
  if (!ctx) throw new Error('useFilmClock() precisa estar dentro de <FilmStage>');
  return ctx;
}

// Deriva CUES (nome da cena -> início cumulativo em segundos) direto da
// lista de cenas — sem a indireção de "retiming" do motor original (não
// existe editor de timeline em produção, então tempo autorado === tempo
// de exibição).
function deriveCues(scenes) {
  let acc = 0;
  const table = {};
  for (const s of scenes) {
    table[s.name] = acc;
    acc += s.dur;
  }
  return { table, total: acc };
}

export function FilmStage({ width = 1920, height = 1080, scenes, bg = '#0A0907', paused = false, children }) {
  const { table: cues, total } = React.useMemo(() => deriveCues(scenes), [scenes]);
  const [time, setTime] = React.useState(0);
  const rafRef = React.useRef(null);
  const lastRef = React.useRef(null);

  React.useEffect(() => {
    if (paused || total <= 0) {
      lastRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setTime((t) => (t + dt) % total);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [paused, total]);

  const value = React.useMemo(() => ({ T: time, CUES: cues, authoredTotal: total }), [time, cues, total]);

  return (
    <div style={{ position: 'absolute', inset: 0, width, height, background: bg, overflow: 'hidden' }}>
      <FilmContext.Provider value={value}>{children}</FilmContext.Provider>
    </div>
  );
}

// <Shot from to> — filhos visíveis só entre dois tempos autorados; ficam
// montados fora da janela (visibility, não display) pra imagem nunca
// recarregar a frio no meio da cena.
export function Shot({ from, to = Infinity, children }) {
  const { T } = useFilmClock();
  const on = T >= from && T < to;
  return (
    <div style={{ position: 'absolute', inset: 0, visibility: on ? 'visible' : 'hidden' }}>
      {children}
    </div>
  );
}
