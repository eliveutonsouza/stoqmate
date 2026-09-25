"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { brl } from '@/lib/format';
import { downloadCsv, toCsv } from '@/lib/csv';
import { useReportHeader } from '@/features/reports/use-report-header';

export function ReportProfit({ report, monthly, filters, stores }) {
  const navigate = useNavigate();
  const { headerProps, scopeLabel, fileSuffix } = useReportHeader(filters, stores);
  const rows = report.byProduct;
  const totalBuy = report.cost;
  const totalSell = report.revenue;
  const totalProfit = totalSell - totalBuy;
  const margin = totalSell > 0 ? (totalProfit / totalSell) * 100 : 0;
  const maxSell = Math.max(1, ...rows.map((r) => r.revenue));
  const maxMonth = Math.max(1, ...monthly.map((m) => m.revenue));
  const sorted = [...rows].sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));

  const exportCsv = () => downloadCsv(`lucratividade_${fileSuffix}.csv`, toCsv(
    ['SKU', 'Produto', 'Categoria', 'Vendidos', 'Custo', 'Vendas', 'Lucro', 'Margem (%)'],
    sorted.map((r) => [
      r.sku, r.name, r.category_name, r.units, r.cost, r.revenue, r.revenue - r.cost,
      r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
    ]),
  ));

  return (
    <StoreShell route="/reports/profit" breadcrumb={['Relatórios', 'Lucratividade']} navigate={navigate}>
      <ReportHeader
        title="Compras vs. vendas"
        sub={`${scopeLabel} · lucro bruto por produto, calculado item a item sobre o custo atual`}
        {...headerProps}
        onExport={exportCsv}
        exportDisabled={rows.length === 0}
      />
      <Page>
        <ReportTabs route="/reports/profit" navigate={navigate} />

        <div className="g4 kpi-strip">
          {[
            { l: 'Custo dos itens vendidos', v: brl(totalBuy) },
            { l: 'Total vendido', v: brl(totalSell), s: `${report.units} unidades vendidas` },
            { l: 'Lucro bruto', v: brl(totalProfit), tone: 'up' },
            { l: 'Margem média', v: margin.toFixed(1) + '%' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'up' ? 'var(--success)' : 'var(--fg)' }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 11, marginTop: 2, color: 'var(--fg-muted)' }}>{m.s}</div>}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Compras vs. vendas por mês</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Últimos 6 meses, {filters.storeId ? 'da loja selecionada' : 'toda a rede'} (não segue o período do topo). A diferença entre as barras é o lucro bruto.</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--fg-faint)' }}></span> Custo</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)' }}></span> Vendas</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', height: 200, paddingBottom: 24 }}>
            {monthly.map((m) => {
              const label = new Date(m.month_start).toLocaleDateString('pt-BR', { month: 'short' });
              return (
                <div key={m.month_start} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{brl(m.revenue - m.cost)}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', height: '100%' }}>
                    <div style={{ flex: 1, height: `${(m.cost / maxMonth) * 100}%`, background: 'var(--fg-faint)', borderRadius: '3px 3px 0 0' }}></div>
                    <div style={{ flex: 1, height: `${(m.revenue / maxMonth) * 100}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }}></div>
                  </div>
                  <span style={{ position: 'absolute', bottom: -20, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Lucro por produto</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ordenado por lucro bruto no período.</p>
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum produto vendido no período.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th><th>Categoria</th>
                  <th className="num">Vendidos</th><th className="num">Custo</th><th className="num">Vendas</th>
                  <th style={{ width: '14%' }}>Proporção</th>
                  <th className="num">Lucro</th><th className="num">Margem</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const profit = r.revenue - r.cost;
                  const rowMargin = r.revenue > 0 ? (profit / r.revenue) * 100 : 0;
                  return (
                    <tr key={r.product_id}>
                      <td>
                        <div style={{ fontSize: 13 }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{r.category_name}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.units}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(r.cost)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.revenue)}</td>
                      <td>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunken)', width: `${(r.revenue / maxSell) * 100}%`, minWidth: 30 }}>
                          <div style={{ width: `${r.revenue > 0 ? (r.cost / r.revenue) * 100 : 0}%`, background: 'var(--fg-faint)' }}></div>
                          <div style={{ flex: 1, background: 'var(--success)' }}></div>
                        </div>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--success)' }}>{brl(profit)}</td>
                      <td className="num">
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                          padding: '2px 6px', borderRadius: 4,
                          background: rowMargin >= 45 ? 'var(--success-soft)' : rowMargin >= 36 ? 'var(--bg-sunken)' : 'var(--warning-soft)',
                          color: rowMargin >= 45 ? 'var(--success)' : rowMargin >= 36 ? 'var(--fg-muted)' : 'var(--warning)',
                        }}>{rowMargin.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-sunken)', fontWeight: 500 }}>
                  <td colSpan={2} style={{ fontSize: 12, padding: '10px 12px', borderTop: '1px solid var(--line)' }}>Total</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{report.units}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{brl(totalBuy)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{brl(totalSell)}</td>
                  <td style={{ borderTop: '1px solid var(--line)' }}></td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{brl(totalProfit)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{margin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
