"use client";

import { SECTION } from '@/features/landing/section';
import { I } from '@/components/icons';

export function LandingFinalCTA({ navigate }) {
  return (
    <section style={{ ...SECTION, paddingBottom: 96 }}>
      <div style={{
        background: 'var(--fg)', color: 'var(--bg)', borderRadius: 14, padding: '52px 44px',
      }} className="lp-cta">
        <div>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: '-0.032em', color: 'var(--bg)', lineHeight: 1.12 }}>
            Amanhã de manhã você já sabe<br/>o que está faltando.
          </h2>
          <p style={{ margin: '14px 0 0', fontSize: 15.5, opacity: 0.72, maxWidth: 520, lineHeight: 1.6 }}>
            30 dias grátis, sem cartão. Importe o catálogo que você já tem e comece a operar hoje —
            se não servir, você exporta tudo e vai embora sem custo.
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 22, fontSize: 12.5, opacity: 0.68, flexWrap: 'wrap' }}>
            {['Sem taxa de implantação', 'Sem fidelidade', 'Suporte em português'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <I.Check size={13} stroke={2.4} /> {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button onClick={() => navigate('/signup')} style={{
            background: 'var(--accent-strong)', color: '#fff', border: 'none', borderRadius: 8,
            padding: '14px 26px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>
            Criar minha conta <I.ArrowRight size={15} />
          </button>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'transparent', color: 'var(--bg)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8, padding: '13px 26px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>
            Explorar sem cadastro
          </button>
        </div>
      </div>
    </section>
  );
}

// Reusable mini chart kept here — other screens import it from window.
