"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AI_OPS, CREDIT_UNIT_COST, CREDIT_WORST, FX, INFRA_PER_STORE, INFRA_STORES, INFRA_TOTAL_USD, OTHER_INFRA, SUPABASE, TOKEN, VARIABLE, infraFor, infraWeight, planEconomics } from '@/lib/plans';
import { brl } from '@/lib/format';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { PlanBadge } from '@/components/domain/plan-badge';

const FX_RATES = [5.0, FX, 6.0, 6.5, 7.0];
const pct = (n) => n.toFixed(0) + '%';

/** Margem P90 de um plano com o câmbio `rate` (tokens e infra são em dólar). */
function marginAt(plan, rate) {
  const e = planEconomics(plan);
  const k = rate / FX;
  const cogs = (e.aiCost + e.infra) * k + e.support + e.gateway + e.whatsapp;
  return ((plan.monthly - cogs) / plan.monthly) * 100;
}

/** @param {{ plans: any[] }} props — planos ativos do banco (preço e cota reais) + premissas de custo. */
export function AdminEconomics({ plans }) {
  const navigate = useNavigate();
  const money = (n) => brl(n);
  const cents = (n) => 'R$ ' + n.toFixed(3).replace('.', ',');

  const header = (
    <PageHeader
      title="Economia unitária"
      sub={`Preço e cota dos planos vêm do catálogo; custos são premissas de planejamento (não é dado medido) · Haiku 4.5 a US$ ${TOKEN.in.toFixed(2)}/US$ ${TOKEN.out.toFixed(2)} por 1M tokens · câmbio de planejamento R$ ${FX.toFixed(2)}`}
      actions={<button onClick={() => navigate('/admin/plans')} className="btn btn-outline btn-sm">Ver planos</button>}
    />
  );

  if (!plans.length) {
    return (
      <AdminShell route="/admin/economics" breadcrumb={['Economia']} navigate={navigate}>
        {header}
        <Page>
          <div className="card" style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
            Nenhum plano pago ativo no catálogo — não há o que calcular.
          </div>
        </Page>
      </AdminShell>
    );
  }

  const rows = plans.map(p => ({ plan: p, e: planEconomics(p) }));
  const entry = plans[0];
  const top = plans[plans.length - 1];
  const mid = plans.find(p => p.id === 'controle') ?? plans[Math.floor(plans.length / 2)];
  const maxRate = FX_RATES[FX_RATES.length - 1];
  const worstAtMax = plans
    .map(p => ({ plan: p, m: marginAt(p, maxRate) }))
    .reduce((a, b) => (b.m < a.m ? b : a));
  const minMargin = Math.min(...rows.map(r => r.e.margin));

  return (
    <AdminShell route="/admin/economics" breadcrumb={['Economia']} navigate={navigate}>
      {header}
      <Page>
        <div className="g4 kpi-strip">
          {[
            { l: 'Custo do crédito', v: cents(CREDIT_UNIT_COST), s: `pior operação + 25% de folga` },
            { l: 'Infra por loja/mês', v: money(infraFor(mid)), s: `${mid.name} · US$ ${INFRA_TOTAL_USD.toFixed(0)} rateados por peso em ${INFRA_STORES} lojas` },
            { l: 'Margem bruta mínima', v: pct(minMargin), s: 'no cenário P90, cota inteira usada' },
            { l: 'Margem no uso típico', v: (rows.reduce((s, r) => s + r.e.p50Margin, 0) / rows.length).toFixed(0) + '%', s: 'P50 · 45% da cota' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{m.v}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 3 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Margem por plano</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
              P90 é a loja que gasta a cota inteira de IA todo mês. Se o plano fecha positivo aí, fecha sempre.
            </p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Plano</th><th className="num">Preço</th><th className="num">IA (P90)</th>
                <th className="num">Infra</th><th className="num">Gateway</th><th className="num">Suporte</th><th className="num">WhatsApp</th>
                <th className="num">Custo total</th><th className="num">Lucro bruto</th><th className="num">Margem P90</th><th className="num">Margem P50</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ plan, e }) => (
                <tr key={plan.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <PlanBadge plan={plan.name} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                          {plan.credits.toLocaleString('pt-BR')} créditos
                          {plan.assumed && <span title="Sem premissa de custo própria — usa as do Controle."> · premissas do Controle</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{money(plan.monthly)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(e.aiCost)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(e.infra)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(e.gateway)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(e.support)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(e.whatsapp)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>{money(e.cogs)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{money(e.gross)}</td>
                  <td className="num">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: e.margin >= 60 ? 'var(--success)' : e.margin >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                      {e.margin.toFixed(0)}%
                    </span>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{e.p50Margin.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Gateway = {(VARIABLE.gatewayPct * 100).toFixed(2)}% + {brl(VARIABLE.gatewayFix)} por cobrança. Suporte é custo humano rateado por tier, não infra.
            No anual o gateway cai para uma cobrança por ano em vez de doze — mais um motivo para empurrar o ciclo anual.
          </div>
        </div>

        <div className="split-2" style={{ '--a': '1.35fr', '--b': '1fr' }}>
          <div className="card table-scroll">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Custo real de cada operação de IA</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Tokens por chamada estimados a partir dos prompts do app. Cache entra a 10% do preço de entrada.
              </p>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Operação</th><th className="num">Cache</th><th className="num">Entrada</th><th className="num">Saída</th>
                  <th className="num">Custo</th><th className="num">Créditos</th><th className="num">Custo/crédito</th>
                </tr>
              </thead>
              <tbody>
                {AI_OPS.map(o => (
                  <tr key={o.id} title={o.note}>
                    <td style={{ fontSize: 12.5 }}>{o.label}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-soft)' }}>{o.cache ? o.cache.toLocaleString('pt-BR') : '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{o.in.toLocaleString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{o.out.toLocaleString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{cents(o.cost)}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.credits}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: o.perCredit >= CREDIT_WORST ? 'var(--warning)' : 'var(--fg-muted)' }}>{cents(o.perCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
              A operação mais cara por crédito é {cents(CREDIT_WORST)}. Vendemos o crédito assumindo {cents(CREDIT_UNIT_COST)} de custo —
              25% de folga para oscilação de câmbio e prompts que crescerem.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Infra para {INFRA_STORES} lojas</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Conta fechada do mês, em dólar.</p>
              </div>
              <div style={{ padding: '4px 18px 10px' }}>
                {[...SUPABASE, ...OTHER_INFRA].map((i) => (
                  <div key={i.l} title={i.note} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                    <span style={{ fontSize: 12.5, flex: 1 }}>{i.l}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i.usd < 0 ? 'var(--success)' : i.usd === 0 ? 'var(--fg-soft)' : 'var(--fg)' }}>
                      {i.usd === 0 ? 'incluso' : (i.usd < 0 ? '− ' : '') + 'US$ ' + Math.abs(i.usd).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingTop: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}>US$ {INFRA_TOTAL_USD.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>Média por loja, a {INFRA_STORES} lojas</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>{money(INFRA_PER_STORE)}</span>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 7, lineHeight: 1.5 }}>
                    Rateio ponderado por peso no banco — uma loja Balcão com 300 SKUs não custa o mesmo que uma unidade de rede.
                  </div>
                  {plans.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '3px 0' }}>
                      <span style={{ fontSize: 12, flex: 1 }}>{p.name} <span style={{ color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>×{infraWeight(p).toFixed(1)}</span></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{money(infraFor(p))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Onde começa o prejuízo</h3>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Quantos créditos uma loja teria que queimar para zerar a margem do plano dela.
              </p>
              {rows.map(({ plan, e }) => (
                <div key={plan.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{plan.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.breakEvenCredits.toLocaleString('pt-BR')}</span>
                    <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{e.abuseHeadroom.toFixed(1)}× a cota</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(1 / e.abuseHeadroom) * 100}%`, background: 'var(--accent)' }}></div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55, marginTop: 4 }}>
                A barra é a cota vendida dentro do limite de prejuízo. Como a IA pausa ao fim da cota,
                esse cenário só acontece se alguém desligar o medidor.
              </div>
            </div>
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Sensibilidade ao câmbio</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
              Tokens e Supabase são cobrados em dólar; a receita é em real. Este é o risco cambial do negócio.
            </p>
          </div>
          <table className="table">
            <thead>
              <tr><th>Câmbio</th>{plans.map(p => <th key={p.id} className="num">{p.name} · margem P90</th>)}<th className="num">Custo do crédito</th></tr>
            </thead>
            <tbody>
              {FX_RATES.map(rate => {
                const k = rate / FX;
                return (
                  <tr key={rate} style={{ background: rate === FX ? 'var(--accent-soft)' : undefined }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: rate === FX ? 600 : 400 }}>
                      R$ {rate.toFixed(2)}{rate === FX ? ' · premissa de planejamento' : ''}
                    </td>
                    {plans.map(p => {
                      const m = marginAt(p, rate);
                      return (
                        <td key={p.id} className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m >= 60 ? 'var(--success)' : m >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                          {m.toFixed(0)}%
                        </td>
                      );
                    })}
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{cents(CREDIT_UNIT_COST * k)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Com o dólar a R$ {maxRate.toFixed(2).replace('.', ',')} — {pct(((maxRate / FX) - 1) * 100)} acima da premissa — a menor margem P90
            é a do {worstAtMax.plan.name}: {pct(worstAtMax.m)}. Câmbio atual não é consultado; compare com a cotação do dia.
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Leitura do estudo</h3>
          <div className="g2" style={{ gap: 18 }}>
            {[
              [minMargin > 0 ? 'Nenhum plano dá prejuízo no P90' : 'Há plano com prejuízo no P90', `Com Haiku 4.5 a US$ ${TOKEN.in.toFixed(2)}/US$ ${TOKEN.out.toFixed(2)} por milhão de tokens, a operação mais cara do sistema — ler uma nota fiscal por foto — custa ${cents(AI_OPS.find(o => o.id === 'ocr').cost)}. A cota inteira do ${mid.name} custa ${money(planEconomics(mid).aiCost)} contra ${money(mid.monthly)} de receita.`],
              ['O gargalo não é a IA, é a infra fixa', `A ${INFRA_STORES} lojas o Supabase e o resto da plataforma pesam ${money(INFRA_PER_STORE)} por loja na média — ${money(infraFor(entry))} no ${entry.name} e ${money(infraFor(top))} no ${top.name}. Abaixo de 40 lojas esse rateio dobra e o plano de entrada aperta: ele só fecha conta com volume.`],
              ['O PITR é metade da conta do Supabase', `US$ 100 dos US$ ${INFRA_TOTAL_USD.toFixed(0)} totais. É caro e é inegociável: num sistema de estoque, perder as movimentações de um dia é perder o cliente. Cortar isso economiza R$ ${(usdToBrlSafe(100) / INFRA_STORES).toFixed(2)} por loja e cria um risco que não se recupera.`],
              ['O que vigiar', 'Prompt que cresce silenciosamente (contexto maior a cada release), varredura de anomalia rodando mais de uma vez por dia por rede, e lojas com muitas unidades no Rede — o rateio de infra é por loja, mas o suporte é por rede.'],
            ].map(([t, d]) => (
              <div key={t}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </Page>
    </AdminShell>
  );
}

function usdToBrlSafe(u) { return u * FX; }
