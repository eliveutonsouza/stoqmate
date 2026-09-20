"use client";

import { SECTION } from '@/features/landing/section';

export function LandingProof() {
  return (
    <section style={{ ...SECTION, paddingBottom: 64 }}>
      <div className="lp-g4" style={{
        gap: 0, background: 'var(--bg-elev)', border: '1px solid var(--line)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {[
          ['318', 'lojas usando hoje'],
          ['1,2 M', 'itens sob controle'],
          ['R$ 4.800', 'ruptura evitada por loja/mês'],
          ['6 min', 'economizados por nota lida'],
        ].map(([v, l], i) => (
          <div key={l} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// === 3 · COST OF INACTION (loss aversion) ===
