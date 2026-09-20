"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';

export function SalesReport({ report }) {
  const navigate = useNavigate();
  const profit = report.revenue - report.cost;
  const margin = report.revenue > 0 ? (profit / report.revenue) * 100 : 0;
  const ticket = report.saleCount > 0 ? report.revenue / report.saleCount : 0;
  const series = report.dailySeries.map((d) => ({
    d: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    v: d.revenue,
  }));
  const maxStoreRevenue = Math.max(1, ...report.byStore.map((s) => s.revenue));
  const totalCategoryRevenue = report.byCategory.reduce((s, c) => s + c.revenue, 0);

  return (
    <StoreShell route="/reports/sales" breadcrumb={['Relatórios', 'Vendas']} navigate={navigate}>
      <ReportHeader title="Relatório de vendas" sub={`Últimos 30 dias · ${report.saleCount} vendas registradas`} />
      <Page>
        <ReportTabs route="/reports/sales" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Receita total', v: brl(report.revenue) },
            { l: 'Unidades vendidas', v: report.units.toLocaleString('pt-BR') },
            { l: 'Ticket médio', v: brl(ticket) },
            { l: 'Margem média', v: margin.toFixed(1) + '%' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por dia</h3>
          {series.length < 2 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
              {series.length === 0 ? 'Nenhuma venda no período.' : `${series[0].d}: ${brl(series[0].v)}`}
            </div>
          ) : (
            <MiniAreaChart data={series} height={200} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por unidade</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>Onde a venda foi registrada na rede.</p>
            {report.byStore.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma venda no período.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {report.byStore.map((ch, i) => (
                  <div key={ch.store_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12 }}>{ch.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{brl(ch.revenue)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                      <div style={{ width: `${(ch.revenue / maxStoreRevenue) * 100}%`, height: '100%', background: i === 0 ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Vendas por categoria</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada categoria conta na sua própria unidade de medida.</p>
            </div>
            {report.byCategory.length === 0 ? (
              <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma venda no período.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Categoria</th><th className="num">Vendidos</th><th className="num">Receita</th><th className="num">Ticket médio</th><th style={{ width: '24%' }}>Share</th></tr>
                </thead>
                <tbody>
                  {report.byCategory.map((m) => {
                    const share = totalCategoryRevenue > 0 ? (m.revenue / totalCategoryRevenue) * 100 : 0;
                    return (
                      <tr key={m.category_id}>
                        <td><CategoryBadge category={m} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {m.units.toLocaleString('pt-BR')}
                          <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 4 }}>{m.unit_plural}</span>
                        </td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(m.revenue)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(m.units > 0 ? m.revenue / m.units : 0)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                              <div style={{ width: `${share}%`, height: '100%', background: m.color, borderRadius: 2 }}></div>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 32, textAlign: 'right' }}>{share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
