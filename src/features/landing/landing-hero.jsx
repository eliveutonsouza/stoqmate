"use client";

import dynamic from 'next/dynamic';
import { SECTION } from '@/features/landing/section';
import { AIChip } from '@/features/ai/ai-chip';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';

// O filme (motor + coreografia + 4 screenshots) só carrega no cliente —
// não entra no HTML estático nem no bundle inicial da rota. Mesmo padrão
// já usado pro CommandPalette (ver .spec/quality-gates.md).
const HeroFilm = dynamic(
  () => import('@/features/landing/hero-film').then((m) => m.HeroFilm),
  { ssr: false, loading: () => <div style={{ width: 634, height: 356, borderRadius: 14, background: '#0A0907' }} /> }
);

export function LandingHero({ navigate, trialDays }) {
  return (
    <section style={{ ...SECTION, paddingTop: 56, paddingBottom: 40 }}>
      <div className="lp-split">
        <div style={{ minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 6px', background: 'var(--bg-elev)',
            border: '1px solid var(--line)', borderRadius: 100,
            fontSize: 12, color: 'var(--fg-muted)', marginBottom: 22,
          }}>
            <AIChip label="Novo" />
            <span>Leitura de nota fiscal por foto</span>
          </div>

          <h1 className="lp-h1" style={{
            margin: 0, fontWeight: 600,
            letterSpacing: '-0.042em', lineHeight: 1.04, maxWidth: 620, textWrap: 'balance',
          }}>
            Pare de descobrir a ruptura<br/>
            <span style={{ color: 'var(--fg-muted)' }}>pela boca do cliente.</span>
          </h1>

          <Lead max={540}>
            Controle de estoque multi-loja para qualquer produto. Você define as categorias do seu ramo,
            a Stoqmate gera os SKUs, avisa antes de faltar e lê a nota do fornecedor por foto.
          </Lead>

          <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg">
              Testar {trialDays} dias grátis <I.ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline btn-lg">
              Ver o sistema funcionando
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 22, fontSize: 12.5, color: 'var(--fg-muted)', flexWrap: 'wrap' }}>
            {['Sem cartão de crédito', 'Migração da planilha inclusa', 'Cancela quando quiser'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--success)', display: 'flex' }}><I.Check size={13} stroke={2.4} /></span> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="lp-shot">
          <HeroFilm />
        </div>
      </div>
    </section>
  );
}

// === 2 · SOCIAL PROOF BAR ===
