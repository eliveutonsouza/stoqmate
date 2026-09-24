"use client";

// Componente público do filme do hero. Dois comportamentos que o design
// original (feito pro editor do claude.ai) não tinha e que valem a pena
// numa página de verdade:
//  - prefers-reduced-motion: nada de motor rodando, só o print estático.
//  - fora da viewport: pausa o requestAnimationFrame (IntersectionObserver),
//    pra não queimar bateria com um loop de 60s atrás de outras seções.
// Ver .spec/testing.md pra cobertura de teste.

import * as React from 'react';
import { FilmStage } from '@/features/landing/hero-film-engine';
import { Film, OM_SCENES } from '@/features/landing/hero-film-scenes';
import { SHOTS } from '@/features/landing/hero-film-pieces';

import { useFitScale } from '@/hooks/use-fit-scale';

const STAGE_W = 1920;
const STAGE_H = 1080;
const MAX_SCALE = 0.33;

function useReducedMotion() {
  // Lazy initial state reads the media query directly — safe because this
  // component only ever renders client-side (next/dynamic ssr:false).
  // The effect below only subscribes to later changes, never sets state
  // synchronously at mount.
  const [reduced, setReduced] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function useInView(ref) {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

export function HeroFilm() {
  const ref = React.useRef(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref);
  const { scale } = useFitScale(ref, STAGE_W, MAX_SCALE);

  return (
    <div
      ref={ref}
      data-testid="hero-film"
      style={{
        width: Math.round(STAGE_W * scale), height: Math.round(STAGE_H * scale), borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 40px 90px rgba(0,0,0,.35)', background: '#0A0907',
      }}
    >
      {reducedMotion ? (
        // Client-only fallback behind next/dynamic(ssr:false); never in the
        // server HTML, so it's never an LCP candidate — next/image's
        // optimizations don't apply here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SHOTS.dashboard}
          alt="Dashboard do Stoqmate"
          data-testid="hero-film-static"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <FilmStage width={STAGE_W} height={STAGE_H} scenes={OM_SCENES} paused={!inView}>
            <Film />
          </FilmStage>
        </div>
      )}
    </div>
  );
}
