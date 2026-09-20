"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';

export function SalesReport() {
  const navigate = useNavigate();
  const total = MOCK.categoryMix.reduce((s, c) => s + c.revenue, 0);
  const byChannel = [
    { name: 'Balcão · Loja Centro', value: 168420, share: 40.8 },
    { name: 'Balcão · Shopping Norte', value: 124180, share: 30.1 },
    { name: 'Balcão · Campinas', value: 78260, share: 19.0 },
    { name: 'Pedidos corporativos', value: 41820, share: 10.1 },
  ];

  return (
    <StoreShell route="/reports/sales" breadcrumb={['Relatórios', 'Vendas']} navigate={navigate}>
      <ReportHeader title="Relatório de vendas" sub="19 ago – 18 set · 1.142 vendas registradas" />
      <Page>
        <ReportTabs route="/reports/sales" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Receita total', v: 'R$ 412.680', sub: '+12,4% vs período anterior', tone: 'up' },
            { l: 'Unidades vendidas', v: '4.286', sub: '+8,1%', tone: 'up' },
            { l: 'Ticket médio', v: 'R$ 361', sub: '+4,2%', tone: 'up' },
            { l: 'Margem média', v: '41,2%', sub: '−1,2pp', tone: 'down' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: m.tone === 'up' ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por dia</h3>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 2, background: 'var(--accent)', borderRadius: 2 }}></span> Este período
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 2, background: 'var(--fg-faint)', borderRadius: 2 }}></span> Período anterior
              </span>
            </div>
          </div>
          <MiniAreaChart data={MOCK.salesSeries} height={200} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por unidade</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>Onde a venda foi registrada na rede.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byChannel.map((ch, i) => (
                <div key={ch.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12 }}>{ch.name}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>R$ {ch.value.toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                    <div style={{ width: `${(ch.value / 168420) * 100}%`, height: '100%', background: i === 0 ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Vendas por categoria</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada categoria conta na sua própria unidade de medida.</p>
            </div>
            <table className="table">
              <thead>
                <tr><th>Categoria</th><th className="num">Vendidos</th><th className="num">Receita</th><th className="num">Ticket médio</th><th style={{ width: '24%' }}>Share</th></tr>
              </thead>
              <tbody>
                {MOCK.categoryMix.map(m => {
                  const c = catById(m.id);
                  const share = (m.revenue / total) * 100;
                  return (
                    <tr key={m.id}>
                      <td><CategoryBadge cat={m.id} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {m.units.toLocaleString('pt-BR')}
                        <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 4 }}>{c.unit === 'unidade' ? 'un' : c.unit}</span>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {m.revenue.toLocaleString('pt-BR')}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(m.revenue / m.units)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${share}%`, height: '100%', background: c.cssVar, borderRadius: 2 }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 32, textAlign: 'right' }}>{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
