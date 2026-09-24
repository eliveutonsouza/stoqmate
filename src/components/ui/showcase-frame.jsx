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

export function ShowcaseFrame({ children, width = 1380, height = 860, scale: maxScale = 0.5, url, radius = 12, chrome = true, eager = false, order = 1 }) {
  const [mounted, setMounted] = React.useState(!!eager);
  const boxRef = React.useRef(null);
  const scale = useFitScale(boxRef, width, maxScale);

  React.useEffect(() => {
    if (mounted) return;
    const id = setTimeout(() => setMounted(true), 140 * order);
    return () => clearTimeout(id);
  }, [mounted, order]);

  return (
    <div ref={boxRef} style={{
      width: width * scale,
      maxWidth: '100%',
      height: height * scale + (chrome ? 34 : 0),
      borderRadius: radius,
      overflow: 'hidden',
      border: '1px solid var(--line)',
      background: 'var(--bg-elev)',
      boxShadow: 'var(--shadow-md)',
      flexShrink: 0,
    }}>
      {chrome && (
        <div style={{
          height: 34, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 7,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#E25C50', '#E6B142', '#5BB85B'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }}></div>
            ))}
          </div>
          <div style={{ flex: 1 }}></div>
          {url && (
            <div style={{
              fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)',
              background: 'var(--bg)', padding: '2px 10px', borderRadius: 4, border: '1px solid var(--line)',
            }}>{url}</div>
          )}
          <div style={{ flex: 1 }}></div>
        </div>
      )}
      <div className="no-bars" style={{ width: width * scale, height: height * scale, overflow: 'hidden', position: 'relative' }}>
        {mounted ? (
          <div style={{
            width, height,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            pointerEvents: 'none', userSelect: 'none',
          }} aria-hidden="true">
            <ShowcaseCtx.Provider value={true}>{children}</ShowcaseCtx.Provider>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-sunken)' }} aria-hidden="true"></div>
        )}
      </div>
    </div>
  );
}
