"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { brl } from '@/lib/format';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';

export function ReportABC({ rows: input, periodDays }) {
  const navigate = useNavigate();
  const total = input.reduce((s, r) => s + r.revenue, 0);
  const rows = input.reduce((acc, r) => {
    const cum = (acc.length ? acc[acc.length - 1].cum : 0) + r.revenue;
    const cumPct = total > 0 ? (cum / total) * 100 : 100;
    const cls = r.revenue === 0 ? 'C' : cumPct <= 70 ? 'A' : cumPct <= 90 ? 'B' : 'C';
    const dailyRate = r.units / periodDays;
    const cover = dailyRate > 0 ? Math.round(r.stock_qty / dailyRate) : null;
    const turns = r.stock_qty > 0 ? +((r.units * (365 / periodDays)) / r.stock_qty).toFixed(1) : 0;
    return [...acc, { ...r, cum, cumPct, cls, cover, turns }];
  }, []);
  const counts = { A: rows.filter((r) => r.cls === 'A').length, B: rows.filter((r) => r.cls === 'B').length, C: rows.filter((r) => r.cls === 'C').length };
  const stockByClass = ['A', 'B', 'C'].map((c) => rows.filter((r) => r.cls === c).reduce((s, r) => s + r.stock_value, 0));
  const totalStock = stockByClass.reduce((a, b) => a + b, 0) || 1;
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));
  const CLS = { A: ['var(--success)', 'var(--success-soft)'], B: ['var(--warning)', 'var(--warning-soft)'], C: ['var(--danger)', 'var(--danger-soft)'] };

  return (
    <StoreShell route="/reports/abc" breadcrumb={['Relatórios', 'Curva ABC']} navigate={navigate}>
      <ReportHeader title="Curva ABC de estoque" sub="Onde está o dinheiro parado — e quais produtos realmente pagam a operação" />
      <Page>
        <ReportTabs route="/reports/abc" navigate={navigate} />

        {rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum produto com estoque ou venda ainda.</div>
        ) : (
          <>
            <div className="g4 kpi-strip">
              {[
                { l: 'Classe A', v: `${counts.A} produtos`, s: `70% da receita · ${brl(stockByClass[0])} em estoque`, tone: 'ok' },
                { l: 'Classe B', v: `${counts.B} produtos`, s: `20% da receita · ${brl(stockByClass[1])} em estoque` },
                { l: 'Classe C', v: `${counts.C} produtos`, s: `10% da receita · ${brl(stockByClass[2])} em estoque`, tone: 'warn' },
                { l: 'Capital parado em C', v: ((stockByClass[2] / totalStock) * 100).toFixed(0) + '%', s: 'do valor total de estoque', tone: 'warn' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{
                    fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4,
                    color: m.tone === 'warn' ? 'var(--warning)' : m.tone === 'ok' ? 'var(--success)' : 'var(--fg)',
                  }}>{m.v}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Concentração de receita</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                    Barras = receita do produto nos últimos {periodDays} dias. A curva mostra quantos produtos bastam para 70%.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
                  {['A', 'B', 'C'].map((c) => (
                    <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: CLS[c][0] }}></span> Classe {c}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, paddingBottom: 26, overflowX: 'auto' }}>
                {rows.slice(0, 60).map((r) => (
                  <div key={r.product_id} style={{ flex: 1, minWidth: 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <div style={{
                      width: '100%', height: `${(r.revenue / maxRevenue) * 100}%`,
                      background: CLS[r.cls][0], borderRadius: '3px 3px 0 0', minHeight: 4,
                    }}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card table-scroll">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Classificação e giro</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                  Giro = quantas vezes o estoque se renova por ano. Cobertura alta com giro baixo é dinheiro na prateleira.
                </p>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}>Classe</th><th>Produto</th><th>Categoria</th>
                    <th className="num">Receita</th><th className="num">% acum.</th>
                    <th className="num">Valor em estoque</th><th className="num">Cobertura</th>
                    <th style={{ width: '14%' }}>Giro anual</th><th style={{ width: 110 }}>Recomendação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.product_id}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 5,
                          background: CLS[r.cls][1], color: CLS[r.cls][0],
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        }}>{r.cls}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb category={{ name: r.category_name, code: r.category_code, icon: r.category_icon, color: r.category_color }} attrs={{}} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td><CategoryBadge category={{ name: r.category_name, code: r.category_code, icon: r.category_icon, color: r.category_color }} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.revenue)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.cumPct.toFixed(1)}%</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.stock_value)}</td>
                      <td className="num">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.cover === null ? 'var(--fg-muted)' : r.cover > 90 ? 'var(--danger)' : r.cover > 60 ? 'var(--warning)' : 'var(--fg-muted)' }}>
                          {r.cover === null ? 'sem venda' : `${r.cover}d`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${Math.min((r.turns / 9) * 100, 100)}%`, height: '100%', borderRadius: 2, background: r.turns >= 4 ? 'var(--success)' : r.turns >= 1.5 ? 'var(--warning)' : 'var(--danger)' }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 28, textAlign: 'right' }}>{r.turns}×</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11.5, color: r.cls === 'A' ? 'var(--success)' : r.cls === 'C' ? 'var(--danger)' : 'var(--fg-muted)' }}>
                          {r.cls === 'A' ? 'Nunca faltar' : r.cls === 'B' ? 'Manter' : (r.cover === null || r.cover > 120) ? 'Liquidar' : 'Reduzir compra'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}
