"use client";

import * as React from 'react';
import { useFitScale } from '@/hooks/use-fit-scale';

export const ShowcaseCtx = React.createContext(false);

// Renders a REAL screen component as product imagery: live, always current,
// sharp at any zoom — unlike a PNG crop, which goes stale the moment the UI moves.
//
// Each frame costs a full sidebar plus tables and charts (~600–1000 nodes), so
// mounting five eagerly put 79% of the landing DOM on the critical path and took
// first load to 13.2s. The box is explicitly sized, so deferring costs no shift.
//
// The gate uses a plain timer on purpose. In embedded viewers IntersectionObserver
// exists but never fires, window.scrollTo moves the page without dispatching
// scroll, and requestIdleCallback ignores even an explicit timeout — all three
// fail silently and leave every frame permanently blank. setTimeout is the only
// primitive that proved reliable, so the hero paints alone and the rest arrive in
// separate short tasks rather than one long one.
//
// Sem espaço pra versão desktop (< 600px), o print vira a tela em largura de
// celular: as media queries do app já olham a viewport do visitante, então
// com a caixa interna em 390px o que aparece é o app de celular de verdade —
// em vez da tela de 1380px reduzida a 25%, ilegível.

const PHONE_W = 390;
const NARROW_BELOW = 600;

export function ShowcaseFrame({ children, width = 1380, height = 860, scale: maxScale = 0.5, mobileHeight = 720, url, radius = 12, chrome = true, eager = false, order = 1 }) {
  const [mounted, setMounted] = React.useState(!!eager);
  const boxRef = React.useRef(null);
  const { scale: desktopScale, available } = useFitScale(boxRef, width, maxScale);
  const phone = available != null && available < NARROW_BELOW;

  const designW = phone ? PHONE_W : width;
  const designH = phone ? mobileHeight : height;
  const scale = phone ? Math.min(1, available / PHONE_W) : desktopScale;
  const barH = chrome ? (phone ? 30 : 34) : 0;

  React.useEffect(() => {
    if (mounted) return;
    const id = setTimeout(() => setMounted(true), 140 * order);
    return () => clearTimeout(id);
  }, [mounted, order]);

  return (
    <div ref={boxRef} style={{
      width: designW * scale,
      maxWidth: '100%',
      height: designH * scale + barH,
      borderRadius: phone ? 22 : radius,
      overflow: 'hidden',
      border: '1px solid var(--line)',
      background: 'var(--bg-elev)',
      boxShadow: 'var(--shadow-md)',
      flexShrink: 0,
      margin: phone ? '0 auto' : undefined,
      position: 'relative',
    }}>
      {chrome && (
        <div style={{
          height: barH, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 7,
        }}>
          {!phone && (
            <div style={{ display: 'flex', gap: 5 }}>
              {['#E25C50', '#E6B142', '#5BB85B'].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }}></div>
              ))}
            </div>
          )}
          <div style={{ flex: 1 }}></div>
          {url && (
            <div style={{
              fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)',
              background: 'var(--bg)', padding: '2px 10px', borderRadius: 4, border: '1px solid var(--line)',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{url}</div>
          )}
          <div style={{ flex: 1 }}></div>
        </div>
      )}
      <div className="no-bars" style={{ width: designW * scale, height: designH * scale, overflow: 'hidden', position: 'relative' }}>
        {mounted ? (
          <div style={{
            width: designW, height: designH,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
          }} aria-hidden="true">
            <ShowcaseCtx.Provider value={true}>{children}</ShowcaseCtx.Provider>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-sunken)' }} aria-hidden="true"></div>
        )}
      </div>
      {phone && (
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent, var(--bg-elev))',
        }}></div>
      )}
    </div>
  );
}
