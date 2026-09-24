"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AI_OPS, ANNUAL, CREDIT_PACKS, FEATURE_MATRIX, MARKET } from '@/lib/plans';
import { I } from '@/components/icons';
import { LayoutPublic } from '@/components/layout/layout-public';
import { AIChip } from '@/features/ai/ai-chip';

export function Pricing({ plans, trialDays }) {
  const navigate = useNavigate();
  const activePlans = plans.filter((p) => p.active);
  const [annual, setAnnual] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(false);
  // Tolerante a cache: se plans.js for de uma geração anterior, a página pública
  // degrada em vez de derrubar o app inteiro.
  const annualInfo = (typeof ANNUAL !== 'undefined' && ANNUAL) || { freeMonths: 2, perks: [] };

  const val = (v) => {
    if (v === true) return <span style={{ color: 'var(--accent-text)', display: 'inline-flex' }}><I.Check size={14} stroke={2.4} /></span>;
    if (v === false) return <span style={{ color: 'var(--fg-muted)' }} title="Não incluído">—</span>;
    return <span style={{ fontSize: 12.5, fontFamily: /^[\d.]+$/.test(String(v)) ? 'var(--font-mono)' : undefined }}>{v}</span>;
  };

  return (
    <LayoutPublic navigate={navigate} route="/pricing">
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '48px var(--page-pad) 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 11.5, color: 'var(--accent-text)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Planos</div>
        <h1 className="lp-h1" style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.036em', lineHeight: 1.06 }}>
          Preço por loja.<br/>Créditos de IA inclusos.
        </h1>
        <p style={{ margin: '20px auto 0', fontSize: 16, color: 'var(--fg-muted)', maxWidth: 560, lineHeight: 1.6 }}>
          {trialDays} dias grátis em qualquer plano, sem cartão. Você vê quanto de IA consumiu e nunca recebe
          cobrança automática por excedente.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <div style={{ display: 'flex', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, padding: 3 }}>
            {[{ k: false, l: 'Mensal' }, { k: true, l: 'Anual' }].map(o => (
              <button key={o.l} onClick={() => setAnnual(o.k)} style={{
                background: annual === o.k ? 'var(--bg-elev)' : 'transparent', border: 'none', borderRadius: 5,
                padding: '6px 16px', fontSize: 13, fontWeight: 500, color: 'var(--fg)',
                boxShadow: annual === o.k ? 'var(--shadow-xs)' : 'none', fontFamily: 'inherit', cursor: 'pointer',
              }}>{o.l}</button>
            ))}
          </div>
          <span className="badge badge-success">{annualInfo.freeMonths} meses grátis no anual</span>
        </div>
        {annual && annualInfo.perks.length > 0 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20, maxWidth: 860, marginLeft: 'auto', marginRight: 'auto' }}>
            {annualInfo.perks.map(([t, d]) => (
              <span key={t} title={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)', border: '1px solid var(--line)', borderRadius: 999, padding: '5px 12px' }}>
                <span style={{ color: 'var(--success)', display: 'flex' }}><I.Check size={11} stroke={2.6} /></span> {t}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '20px var(--page-pad) 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, alignItems: 'start' }}>
          {activePlans.map(p => {
            const shown = annual ? Math.round(p.yearly / 12) : p.monthly;
            return (
              <div key={p.id} style={{
                background: p.popular ? 'var(--fg)' : 'var(--bg-elev)',
                color: p.popular ? 'var(--bg)' : 'var(--fg)',
                border: '1px solid ' + (p.popular ? 'var(--fg)' : 'var(--line)'),
                borderRadius: 12, padding: 24, position: 'relative',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: 18, right: 18,
                    background: 'var(--accent-strong)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em',
                  }}>MAIS ESCOLHIDO</div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4, minHeight: 38, lineHeight: 1.5 }}>{p.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}>
                  <span style={{ fontSize: 'clamp(30px, 7vw, 38px)', fontWeight: 600, letterSpacing: '-0.032em', fontVariantNumeric: 'tabular-nums' }}>R$ {shown}</span>
                  <span style={{ fontSize: 13, opacity: 0.62 }}>/loja/mês</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3, fontFamily: 'var(--font-mono)', minHeight: 15 }}>
                  {annual ? `cobrado R$ ${p.yearly.toLocaleString('pt-BR')}/ano por loja` : ''}
                </div>

                <div style={{
                  marginTop: 14, padding: '10px 12px', borderRadius: 7,
                  background: p.popular ? 'rgba(255,255,255,0.10)' : 'var(--accent-soft)',
                  color: p.popular ? 'var(--bg)' : 'var(--accent-text)',
                  fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <I.Sparkle size={13} /> {p.credits.toLocaleString('pt-BR')} créditos de IA/mês
                </div>

                <button onClick={() => navigate('/signup')}
                  className={p.popular ? 'btn btn-primary btn-lg' : 'btn btn-outline btn-lg'}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                  Começar com {p.name}
                </button>

                <div style={{ fontSize: 11.5, opacity: 0.62, textAlign: 'center', marginTop: 9 }}>{p.who}</div>

                <div style={{
                  marginTop: 18, paddingTop: 14,
                  borderTop: '1px solid ' + (p.popular ? 'rgba(255,255,255,0.15)' : 'var(--line)'),
                  display: 'flex', flexDirection: 'column', gap: 7,
                }}>
                  {[
                    p.limits.skus ? `${p.limits.skus} SKUs` : 'SKUs ilimitados',
                    p.limits.users ? `${p.limits.users} usuários` : 'Usuários ilimitados',
                    p.limits.stores ? (p.limits.stores === 1 ? '1 loja' : `Até ${p.limits.stores} lojas`) : 'Lojas ilimitadas',
                    p.limits.cats ? `${p.limits.cats} categorias` : 'Categorias ilimitadas',
                    `Histórico de ${p.limits.history}`,
                  ].map(l => (
                    <div key={l} style={{ display: 'flex', gap: 8, fontSize: 12.5, alignItems: 'flex-start' }}>
                      <span style={{ color: p.popular ? '#fff' : 'var(--accent-text)', marginTop: 2, flexShrink: 0 }}><I.Check size={12} stroke={2.4} /></span>
                      <span style={{ opacity: 0.9 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Credits explained — the unit the whole model rests on */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '16px var(--page-pad) 36px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.014em', display: 'flex', alignItems: 'center', gap: 9 }}>
                Como funcionam os créditos de IA <AIChip />
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                Cada operação custa o que realmente consome. Ler uma nota pesa mais que fazer uma pergunta.
              </p>
            </div>
            <button onClick={() => setShowWhy(!showWhy)} className="btn btn-outline btn-sm">
              {showWhy ? 'Ocultar' : 'Ver tabela'}
            </button>
          </div>

          {showWhy && (
            <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Operação</th><th className="num">Custa</th>
                  {plans.map((p) => <th key={p.id} className="num">No {p.name}</th>)}
                  <th>Por quê</th>
                </tr>
              </thead>
              <tbody>
                {AI_OPS.map(op => (
                  <tr key={op.id}>
                    <td style={{ fontSize: 13 }}>{op.label}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
                      {op.credits} {op.credits === 1 ? 'crédito' : 'créditos'}
                    </td>
                    {plans.map(p => (
                      <td key={p.id} className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
                        {Math.floor(p.credits / op.credits).toLocaleString('pt-BR')}×
                      </td>
                    ))}
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{op.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          <div style={{ padding: '14px 20px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, minWidth: 260, lineHeight: 1.5 }}>
              Acabaram os créditos? A IA pausa e o resto do sistema segue funcionando. Você escolhe comprar um pacote
              ou esperar o mês virar — nunca cobramos excedente automaticamente.
            </span>
            {CREDIT_PACKS.map(pk => (
              <div key={pk.credits} style={{
                padding: '8px 12px', background: 'var(--bg-elev)', border: '1px solid var(--line)',
                borderRadius: 7, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>+{pk.credits.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>R$ {pk.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full feature matrix */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '16px var(--page-pad) 40px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.014em' }}>Comparativo completo</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
              O que é operação básica está em todos os planos. O que só existe com várias lojas sobe de tier.
            </p>
          </div>
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Recurso</th>
                {plans.map(p => (
                  <th key={p.id} style={{ textAlign: 'center', background: p.popular ? 'var(--accent-soft)' : undefined }}>
                    <span style={{ color: p.popular ? 'var(--accent-text)' : 'var(--fg-muted)', fontWeight: p.popular ? 600 : 500 }}>{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map(g => (
                <React.Fragment key={g.g}>
                  <tr>
                    <td colSpan={4} style={{
                      background: 'var(--bg-sunken)', fontSize: 11, fontWeight: 600,
                      color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px',
                    }}>{g.g}</td>
                  </tr>
                  {g.rows.map(r => (
                    <tr key={r[0]}>
                      <td style={{ fontSize: 13 }}>{r[0]}</td>
                      <td style={{ textAlign: 'center' }}>{val(r[1])}</td>
                      <td style={{ textAlign: 'center', background: 'var(--accent-soft)' }}>{val(r[2])}</td>
                      <td style={{ textAlign: 'center' }}>{val(r[3])}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* Market anchor */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '16px var(--page-pad) 40px' }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.014em' }}>Onde isso fica no mercado</h3>
          <p style={{ margin: '5px 0 20px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Sistemas de gestão para varejo no Brasil, plano equivalente ao nosso Controle.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {MARKET.map(m => (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: m.us ? 600 : 400, color: m.us ? 'var(--accent-text)' : 'var(--fg)' }}>
                    {m.name} <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>· {m.note}</span>
                  </span>
                  <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', fontWeight: m.us ? 600 : 400 }}>R$ {m.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                  <div style={{
                    width: `${(m.price / 379) * 100}%`, height: '100%', borderRadius: 3,
                    background: m.us ? 'var(--accent)' : 'var(--fg-faint)',
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '32px var(--page-pad) 72px' }}>
        <h2 style={{ margin: '0 0 22px', fontSize: 26, fontWeight: 600, letterSpacing: '-0.026em' }}>Dúvidas sobre cobrança</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['Por que o preço é por loja?', 'Porque o custo de operar cresce por loja: mais movimentações, mais estoque, mais usuários e mais chamadas de IA. Cobrar por rede faria a loja pequena pagar pela grande.'],
            ['O que conta como um SKU?', 'Cada combinação de atributos da categoria. Se Vestuário tem Cor e Tamanho, uma camiseta em 6 tamanhos e 2 cores ocupa 12 SKUs. No Controle e na Rede os SKUs são ilimitados.'],
            ['Os créditos de IA acumulam de um mês para o outro?', 'Não. A cota zera no primeiro dia do ciclo. Créditos de pacote adicional, esses sim, não expiram.'],
            ['Posso mudar de plano no meio do mês?', 'Sim. Ao subir, a diferença é proporcional e os créditos novos entram na hora. Ao descer, vale no próximo ciclo.'],
            ['Como funciona o cancelamento?', 'A qualquer momento no painel, sem falar com ninguém. O acesso continua até o fim do ciclo pago e os dados ficam exportáveis por 90 dias.'],
            ['Tem taxa de implantação ou de migração?', 'Não. A importação do catálogo é do próprio sistema, e no Controle e na Rede a migração assistida por videochamada está inclusa.'],
          ].map(([q, a], i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{q}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 6, lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>
    </LayoutPublic>
  );
}

// === Auth shell: split screen ===
