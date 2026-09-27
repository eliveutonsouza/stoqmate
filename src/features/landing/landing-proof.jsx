"use client";

import { SECTION } from '@/features/landing/section';

// Faixa logo abaixo do hero: o que o sistema faz, em quatro linhas. Sem
// contagem de clientes ou economia média — não temos base pra esses números.
export function LandingProof() {
  return (
    <section style={{ ...SECTION, paddingBottom: 64 }}>
      <div className="lp-g4" style={{
        gap: 0, background: 'var(--bg-elev)', border: '1px solid var(--line)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {[
          ['Várias lojas', 'um catálogo, saldo por unidade'],
          ['Nota por foto', 'a IA lê e monta a entrada pra você conferir'],
          ['Aviso de ruptura', 'quando o item chega no mínimo'],
          ['Curva ABC', 'o que gira e o que está parado'],
        ].map(([v, l], i) => (
          <div key={l} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// === 3 · COST OF INACTION (loss aversion) ===
