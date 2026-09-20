"use client";

import { Eyebrow } from '@/features/landing/eyebrow';
import { I } from '@/components/icons';

export function FeatureRow({ eyebrow, title, body, bullets, children, flip, navigate, cta }) {
  return (
    <div className="lp-split" style={{ padding: '44px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ order: flip ? 2 : 1, minWidth: 0 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="lp-h3" style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.026em', lineHeight: 1.18, maxWidth: 440, textWrap: 'pretty' }}>
          {title}
        </h3>
        <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 460 }}>{body}</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {bullets.map(b => (
            <li key={b} style={{ display: 'flex', gap: 9, fontSize: 13.5, alignItems: 'flex-start', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--accent-text)', marginTop: 2, flexShrink: 0 }}><I.Check size={13} stroke={2.4} /></span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {cta && (
          <button onClick={() => navigate(cta.r)} className="btn btn-outline btn-sm" style={{ marginTop: 20 }}>
            {cta.l} <I.ArrowRight size={12} />
          </button>
        )}
      </div>
      <div className="lp-shot" style={{ order: flip ? 1 : 2 }}>{children}</div>
    </div>
  );
}
