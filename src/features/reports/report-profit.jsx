"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { I } from '@/components/icons';
import { CategoryBadge } from '@/components/ui/category-badge';

export function ReportProfit() {
  const navigate = useNavigate();
  const rows = [
    { sku: 'ELE-FONE', cat: 'eletronicos', name: 'Fone Bluetooth ANC', units: 184, buy: 29072, sell: 55020 },
    { sku: 'CAL-ESP3', cat: 'calcados', name: 'Tênis Esporte 3', units: 148, buy: 24864, sell: 41412 },
    { sku: 'VES-CPIM', cat: 'vestuario', name: 'Camiseta Algodão Pima', units: 312, buy: 15548, sell: 27768 },
    { sku: 'ALI-CAFE', cat: 'alimentos', name: 'Café em Grãos', units: 428, buy: 17462, sell: 25680 },
    { sku: 'ELE-CARR', cat: 'eletronicos', name: 'Carregador GaN 65W', units: 132, buy: 12224, sell: 24948 },
    { sku: 'CAS-TOAL', cat: 'casa', name: 'Jogo de Toalhas', units: 96, buy: 11309, sell: 18240 },
    { sku: 'CAL-BOTA', cat: 'calcados', name: 'Bota Couro Trilha', units: 38, buy: 9942, sell: 17442 },
    { sku: 'PAP-CAD2', cat: 'papelaria', name: 'Caderno Pautado 200f', units: 386, buy: 8399, sell: 13124 },
  ];
  const totalBuy = rows.reduce((s, r) => s + r.buy, 0);
  const totalSell = rows.reduce((s, r) => s + r.sell, 0);
  const totalProfit = totalSell - totalBuy;
  const maxSell = Math.max(...rows.map(r => r.sell));

  const monthly = [
    { m: 'Abr', buy: 142000, sell: 238000 }, { m: 'Mai', buy: 156000, sell: 261000 },
    { m: 'Jun', buy: 168000, sell: 294000 }, { m: 'Jul', buy: 182000, sell: 318000 },
    { m: 'Ago', buy: 196000, sell: 367000 }, { m: 'Set', buy: 214000, sell: 413000 },
  ];
  const maxMonth = Math.max(...monthly.map(m => m.sell));

  return (
    <StoreShell route="/reports/profit" breadcrumb={['Relatórios', 'Lucratividade']} navigate={navigate}>
      <ReportHeader title="Compras vs. vendas" sub="Lucro bruto por produto, calculado item a item sobre o custo de entrada" />
      <Page>
        <ReportTabs route="/reports/profit" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Total comprado', v: 'R$ ' + totalBuy.toLocaleString('pt-BR'), s: '16.330 itens em estoque' },
            { l: 'Total vendido', v: 'R$ ' + totalSell.toLocaleString('pt-BR'), s: '4.286 unidades vendidas' },
            { l: 'Lucro bruto', v: 'R$ ' + totalProfit.toLocaleString('pt-BR'), s: '+12,4% vs período anterior', tone: 'up' },
            { l: 'Margem média', v: ((totalProfit / totalSell) * 100).toFixed(1) + '%', s: 'meta da rede: 45%', tone: 'down' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: i === 2 ? 'var(--success)' : 'var(--fg)' }}>{m.v}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--warning)' : 'var(--fg-muted)', fontFamily: m.tone ? 'var(--font-mono)' : undefined }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Compras vs. vendas por mês</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Últimos 6 meses, toda a rede. A diferença entre as barras é o lucro bruto.</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--fg-faint)' }}></span> Compras</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)' }}></span> Vendas</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', height: 200, paddingBottom: 24 }}>
            {monthly.map(m => (
              <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>+{((m.sell - m.buy) / 1000).toFixed(0)}k</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', height: '100%' }}>
                  <div style={{ flex: 1, height: `${(m.buy / maxMonth) * 100}%`, background: 'var(--fg-faint)', borderRadius: '3px 3px 0 0' }}></div>
                  <div style={{ flex: 1, height: `${(m.sell / maxMonth) * 100}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }}></div>
                </div>
                <span style={{ position: 'absolute', bottom: -20, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{m.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Lucro por produto</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ordenado por lucro bruto no período.</p>
            </div>
            <button className="btn btn-outline btn-sm"><I.Download size={12} /> Exportar linha a linha</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th><th>Categoria</th>
                <th className="num">Vendidos</th><th className="num">Compras</th><th className="num">Vendas</th>
                <th style={{ width: '14%' }}>Proporção</th>
                <th className="num">Lucro</th><th className="num">Margem</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => (b.sell - b.buy) - (a.sell - a.buy)).map((r, i) => {
                const profit = r.sell - r.buy;
                const margin = (profit / r.sell) * 100;
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                    </td>
                    <td><CategoryBadge cat={r.cat} /></td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.units}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>R$ {r.buy.toLocaleString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {r.sell.toLocaleString('pt-BR')}</td>
                    <td>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunken)', width: `${(r.sell / maxSell) * 100}%`, minWidth: 30 }}>
                        <div style={{ width: `${(r.buy / r.sell) * 100}%`, background: 'var(--fg-faint)' }}></div>
                        <div style={{ flex: 1, background: 'var(--success)' }}></div>
                      </div>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--success)' }}>R$ {profit.toLocaleString('pt-BR')}</td>
                    <td className="num">
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                        padding: '2px 6px', borderRadius: 4,
                        background: margin >= 45 ? 'var(--success-soft)' : margin >= 36 ? 'var(--bg-sunken)' : 'var(--warning-soft)',
                        color: margin >= 45 ? 'var(--success)' : margin >= 36 ? 'var(--fg-muted)' : 'var(--warning)',
                      }}>{margin.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-sunken)', fontWeight: 500 }}>
                <td colSpan={2} style={{ fontSize: 12, padding: '10px 12px', borderTop: '1px solid var(--line)' }}>Total</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>1.724</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>R$ {totalBuy.toLocaleString('pt-BR')}</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>R$ {totalSell.toLocaleString('pt-BR')}</td>
                <td style={{ borderTop: '1px solid var(--line)' }}></td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', borderTop: '1px solid var(--line)', padding: '10px 12px' }}>R$ {totalProfit.toLocaleString('pt-BR')}</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>{((totalProfit / totalSell) * 100).toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Page>
    </StoreShell>
  );
}
