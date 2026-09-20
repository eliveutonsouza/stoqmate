"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { brl } from '@/lib/format';

function fmtRange(range) {
  const opts = { day: '2-digit', month: 'short' };
  return `${range.start.toLocaleDateString('pt-BR', opts)} – ${range.end.toLocaleDateString('pt-BR', opts)}`;
}

export function ReportsHub({ report }) {
  const navigate = useNavigate();
  const profit = report.revenue - report.cost;
  const margin = report.revenue > 0 ? (profit / report.revenue) * 100 : 0;
  const ticket = report.saleCount > 0 ? report.revenue / report.saleCount : 0;
  const series = report.dailySeries.map((d) => ({
    d: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    v: d.revenue,
  }));
  const leaderCategory = report.byCategory[0];

  return (
    <StoreShell route="/reports" breadcrumb={['Relatórios']} navigate={navigate}>
      <PageHeader title="Relatórios" sub={`${fmtRange(report.range)} · toda a rede`} />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Receita do período', v: brl(report.revenue) },
            { l: 'Unidades vendidas', v: report.units.toLocaleString('pt-BR') },
            { l: 'Lucro bruto', v: brl(profit) },
            { l: 'Margem média', v: margin.toFixed(1) + '%' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-h"><h3>Relatórios disponíveis</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <HubCard icon={<I.Chart size={15} />} accent title="Vendas" onClick={() => navigate('/reports/sales')}
              desc="Receita por dia e por unidade da rede, com ticket médio."
              meta={[['Receita', brl(report.revenue)], ['Vendas', `${report.saleCount}`], ['Ticket', brl(ticket)]]} />
            <HubCard icon={<I.Layers size={15} />} accent title="Categorias e produtos" onClick={() => navigate('/reports/categories')}
              desc="Participação de cada categoria no faturamento e ranking dos produtos mais vendidos."
              meta={[['Categorias', `${report.byCategory.length}`], ['Produtos', `${report.byProduct.length}`], ['Líder', leaderCategory?.name ?? '—']]} />
            <HubCard icon={<I.Sliders size={15} />} accent title="Atributos mais vendidos" onClick={() => navigate('/reports/attributes')}
              desc="Quais variações giram, no esquema de cada categoria. Adapta-se quando você muda os atributos."
              meta={[['Categorias', `${report.byCategory.length}`]]} />
            <HubCard icon={<I.Credit size={15} />} accent title="Lucratividade" onClick={() => navigate('/reports/profit')}
              desc="Compras vs. vendas item a item, com lucro bruto e margem por produto."
              meta={[['Lucro', brl(profit)], ['Margem', margin.toFixed(1) + '%']]} />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita por dia</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Resumo do período selecionado.</p>
            </div>
            <button onClick={() => navigate('/reports/sales')} className="btn btn-ghost btn-sm">Abrir relatório <I.ChevronRight size={12} /></button>
          </div>
          {series.length < 2 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
              {series.length === 0 ? 'Nenhuma venda no período.' : `${series[0].d}: ${brl(series[0].v)}`}
            </div>
          ) : (
            <MiniAreaChart data={series} height={170} />
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
