"use client";

import * as React from 'react';
import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { ANNUAL, PLANS, annualSavings } from '@/lib/plans';
import { PLAN_BENEFITS } from '@/features/landing/plan-benefits';
import { I } from '@/components/icons';

export function LandingPricingTeaser({ navigate }) {
  const [annual, setAnnual] = React.useState(false);

  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Eyebrow>Planos</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <H2 max={560}>Preço por loja. Sem taxa de implantação.</H2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Lead max={520}>Todos os planos incluem créditos de IA. Você vê quanto usou e nunca recebe cobrança surpresa.</Lead>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: 3 }}>
            {[{ k: false, l: 'Mensal' }, { k: true, l: 'Anual' }].map(o => (
              <button key={o.l} onClick={() => setAnnual(o.k)} style={{
                background: annual === o.k ? 'var(--bg-elev)' : 'transparent',
                border: '1px solid ' + (annual === o.k ? 'var(--line)' : 'transparent'),
                borderRadius: 6, padding: '7px 20px', fontSize: 13.5, fontWeight: 500,
                color: annual === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                boxShadow: annual === o.k ? 'var(--shadow-xs)' : 'none', fontFamily: 'inherit', cursor: 'pointer',
              }}>{o.l}</button>
            ))}
          </div>
          <span className="badge badge-success">{ANNUAL.freeMonths} meses grátis</span>
        </div>
      </div>

      <div className="lp-g3" style={{ maxWidth: 1000, margin: '0 auto', alignItems: 'stretch' }}>
        {PLANS.map(p => {
          const s = annualSavings(p, 1);
          const shown = annual ? Math.round(p.yearly / 12) : p.monthly;
          const ben = PLAN_BENEFITS[p.id];
          const ink = p.popular ? 'var(--bg)' : 'var(--fg)';
          return (
            <div key={p.id} style={{
              background: p.popular ? 'var(--fg)' : 'var(--bg-elev)',
              color: ink,
              border: '1px solid ' + (p.popular ? 'var(--fg)' : 'var(--line)'),
              borderRadius: 12, padding: 22, position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}>
              {p.popular && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--accent-strong)', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em',
                }}>MAIS ESCOLHIDO</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75 }}>{p.name}</div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 12 }}>
                <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em' }}>R$ {shown}</span>
                <span style={{ fontSize: 12.5, opacity: 0.65 }}>/loja/mês</span>
              </div>
              <div style={{ fontSize: 11.5, marginTop: 4, minHeight: 17, fontFamily: 'var(--font-mono)', opacity: annual ? 0.85 : 0.55 }}>
                {annual
                  ? `R$ ${p.yearly.toLocaleString('pt-BR')} por ano · economia de R$ ${s.save.toLocaleString('pt-BR')}`
                  : 'cobrado todo mês'}
              </div>

              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8, lineHeight: 1.5 }}>{p.tagline}</div>

              <div style={{
                marginTop: 16, padding: '9px 11px', borderRadius: 7,
                background: p.popular ? 'rgba(255,255,255,0.10)' : 'var(--accent-soft)',
                color: p.popular ? 'var(--bg)' : 'var(--accent-text)',
                fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <I.Sparkle size={12} /> {p.credits.toLocaleString('pt-BR')} créditos de IA/mês
              </div>

              <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>{p.limits.skus ? `${p.limits.skus} SKUs` : 'SKUs ilimitados'}</span>
                <span>·</span>
                <span>{p.limits.users ? `${p.limits.users} usuários` : 'Usuários ilimitados'}</span>
                <span>·</span>
                <span>{p.limits.stores ? (p.limits.stores === 1 ? '1 loja' : `até ${p.limits.stores} lojas`) : 'Lojas ilimitadas'}</span>
              </div>

              {ben.head && (
                <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 16, letterSpacing: '0.02em' }}>{ben.head}</div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: ben.head ? '8px 0 20px' : '16px 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {ben.items.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, alignItems: 'flex-start', lineHeight: 1.45 }}>
                    <span style={{ color: p.popular ? '#fff' : 'var(--accent-text)', marginTop: 2, flexShrink: 0 }}><I.Check size={12} stroke={2.4} /></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => navigate(annual ? '/checkout' : '/pricing')}
                className={p.popular ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'center' }}>
                Começar com {p.name}
              </button>
            </div>
          );
        })}
      </div>

      {annual && (
        <div style={{ maxWidth: 1000, margin: '16px auto 0', padding: '16px 20px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>O que o ciclo anual dá em qualquer plano</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            {ANNUAL.perks.map(([t2, d]) => (
              <div key={t2} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}><I.Check size={13} stroke={2.4} /></span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t2}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.45 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <button onClick={() => navigate('/pricing')} className="btn btn-ghost btn-sm">
          Ver comparação completa dos planos <I.ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
}

// === 11 · FAQ (objection handling) ===
