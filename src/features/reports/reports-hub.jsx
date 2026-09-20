"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { MOCK } from '@/lib/mock';

export function ReportsHub() {
  const navigate = useNavigate();
  return (
    <StoreShell route="/reports" breadcrumb={['Relatórios']} navigate={navigate}>
      <PageHeader
        title="Relatórios"
        sub="19 ago – 18 set · toda a rede"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Filter size={13} /> 19 ago – 18 set <I.ChevronDown size={11} /></button>
            <button className="btn btn-outline btn-sm"><I.Store size={13} /> Toda a rede <I.ChevronDown size={11} /></button>
          </>
        )}
      />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Receita do período', v: 'R$ 412.680', s: '+12,4%', tone: 'up' },
            { l: 'Unidades vendidas', v: '4.286', s: '+8,1%', tone: 'up' },
            { l: 'Lucro bruto', v: 'R$ 100.508', s: '+11,2%', tone: 'up' },
            { l: 'Margem média', v: '41,2%', s: '−1,2pp', tone: 'down' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: m.tone === 'up' ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-h"><h3>Relatórios disponíveis</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <HubCard icon={<I.Chart size={15} />} accent title="Vendas" onClick={() => navigate('/reports/sales')}
              desc="Receita por dia e por unidade da rede, com comparativo do período anterior e ticket médio."
              meta={[['Receita', 'R$ 412.680'], ['Vendas', '1.142'], ['Ticket', 'R$ 361']]} />
            <HubCard icon={<I.Layers size={15} />} accent title="Categorias e produtos" onClick={() => navigate('/reports/categories')}
              desc="Participação de cada categoria no faturamento e ranking dos produtos mais vendidos."
              meta={[['Categorias', '6'], ['Produtos', '142'], ['Líder', 'Eletrônicos']]} />
            <HubCard icon={<I.Sliders size={15} />} accent title="Atributos mais vendidos" onClick={() => navigate('/reports/attributes')}
              desc="Quais variações giram, no esquema de cada categoria. Adapta-se quando você muda os atributos."
              meta={[['Atributos', '12'], ['Cor líder', 'Preto'], ['Tam. líder', 'M']]} />
            <HubCard icon={<I.Credit size={15} />} accent title="Lucratividade" onClick={() => navigate('/reports/profit')}
              desc="Compras vs. vendas item a item, com lucro bruto e margem por produto e por mês."
              meta={[['Lucro', 'R$ 100.508'], ['Margem', '41,2%'], ['Meta', '45%']]} />
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
          <MiniAreaChart data={MOCK.salesSeries} height={170} />
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Download size={16} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Exportações agendadas</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
              Receba os relatórios de vendas e lucratividade por email toda segunda, em XLSX.
            </div>
          </div>
          <span className="badge">Desativado</span>
          <button className="btn btn-outline btn-sm">Configurar</button>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /settings — configurações index ===
