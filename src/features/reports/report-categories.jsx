"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { DonutChart } from '@/components/domain/donut-chart';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductThumb } from '@/components/ui/product-thumb';
import { brl } from '@/lib/format';

export function ReportCategories({ report }) {
  const navigate = useNavigate();
  const total = report.byCategory.reduce((s, c) => s + c.revenue, 0);
  const maxRev = Math.max(1, ...report.byCategory.map((c) => c.revenue));
  const maxUnits = Math.max(1, ...report.byProduct.map((p) => p.units));
  const leaderRevenue = report.byCategory[0];
  const leaderVolume = [...report.byCategory].sort((a, b) => b.units - a.units)[0];

  return (
    <StoreShell route="/reports/categories" breadcrumb={['Relatórios', 'Categorias e produtos']} navigate={navigate}>
      <ReportHeader title="Categorias e produtos" sub={`${report.byCategory.length} categorias com venda no período · ${report.byProduct.length} produtos`} />
      <Page>
        <ReportTabs route="/reports/categories" navigate={navigate} />

        <div className="g2 kpi-strip">
          {[
            { l: 'Categoria líder em receita', v: leaderRevenue?.name ?? '—', s: leaderRevenue ? `${((leaderRevenue.revenue / total) * 100).toFixed(1)}% do faturamento` : 'sem venda no período' },
            { l: 'Categoria líder em volume', v: leaderVolume?.name ?? '—', s: leaderVolume ? `${leaderVolume.units.toLocaleString('pt-BR')} ${leaderVolume.unit_plural} vendidas` : 'sem venda no período' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.022em', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: 'var(--fg-muted)' }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="g2">
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Participação no faturamento</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--fg-muted)' }}>Do total vendido no período.</p>
            {report.byCategory.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma venda no período.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <DonutChart size={150} thickness={22} segments={report.byCategory.map((m) => ({ value: m.revenue, color: m.color }))} center={(
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{brl(total)}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>receita</div>
                  </div>
                )} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.byCategory.map((m) => (
                    <div key={m.category_id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: m.color }}></span>
                      <span style={{ fontSize: 12, flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{((m.revenue / total) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card table-scroll">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Desempenho por categoria</h3>
            </div>
            {report.byCategory.length === 0 ? (
              <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma venda no período.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Categoria</th><th className="num">Vendidos</th><th className="num">Receita</th><th style={{ width: '22%' }}>Share</th></tr>
                </thead>
                <tbody>
                  {report.byCategory.map((m) => (
                    <tr key={m.category_id}>
                      <td><CategoryBadge category={m} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.units.toLocaleString('pt-BR')}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(m.revenue)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${(m.revenue / maxRev) * 100}%`, height: '100%', background: m.color, borderRadius: 2 }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 32, textAlign: 'right' }}>
                            {((m.revenue / total) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Top produtos da rede</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ordenado por receita no período.</p>
          </div>
          {report.byProduct.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum produto vendido no período.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th><th>Produto</th><th>Categoria</th>
                  <th style={{ width: '20%' }}>Vendidos</th>
                  <th className="num">Receita</th><th className="num">Ticket médio</th><th className="num">Margem</th>
                </tr>
              </thead>
              <tbody>
                {report.byProduct.slice(0, 20).map((p, i) => {
                  const margin = p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.product_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb brand={p.brand} attrs={{}} category={{ name: p.category_name, code: p.category_name?.slice(0, 2) }} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.category_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${(p.units / maxUnits) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right', color: 'var(--fg-muted)' }}>{p.units}</span>
                        </div>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.revenue)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(p.units > 0 ? p.revenue / p.units : 0)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: margin >= 45 ? 'var(--success)' : 'var(--fg-muted)' }}>{margin.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
