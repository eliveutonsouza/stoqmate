"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { NET_UNITS } from '@/features/analysis/net-units';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { MiniAreaChart } from '@/components/domain/mini-area-chart';
import { MOCK } from '@/lib/mock';
import { DonutChart } from '@/components/domain/donut-chart';

export function NetworkDashboard() {
  const navigate = useNavigate();
  const totalRev = NET_UNITS.reduce((s, u) => s + u.revenue, 0);
  const maxRev = Math.max(...NET_UNITS.map(u => u.revenue));

  // same SKU, imbalanced across units — the actionable insight of a network view
  const imbalance = [
    { sku: 'ELE-FONE-PR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' }, rows: [2, 28, 9, 164], sold: [62, 48, 22, 0] },
    { sku: 'VES-CPIM-BR-GG', cat: 'vestuario', name: 'Camiseta Algodão Pima', attrs: { cor: 'Branco', tamanho: 'GG' }, rows: [3, 42, 6, 88], sold: [44, 18, 14, 0] },
    { sku: 'CAL-ESP3-PR-38', cat: 'calcados', name: 'Tênis Esporte 3', attrs: { cor: 'Preto', numeracao: '38' }, rows: [1, 4, 26, 36], sold: [28, 12, 6, 0] },
    { sku: 'ALI-CAFE-IN-5KG', cat: 'alimentos', name: 'Café em Grãos', attrs: { sabor: 'Intenso', peso: '5 kg' }, rows: [2, 6, 3, 48], sold: [18, 9, 4, 0] },
  ];

  return (
    <StoreShell route="/network" breadcrumb={['Rede']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span><span>4 unidades sincronizadas</span>
        </div>
      )}
    >
      <PageHeader
        title="Visão da rede"
        sub="19 ago – 18 set · 4 unidades · 7.998 SKUs · consolidado e comparativo"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Filter size={13} /> 30 dias <I.ChevronDown size={11} /></button>
            <button onClick={() => navigate('/stock/transfer')} className="btn btn-primary btn-sm"><I.Swap size={13} /> Transferir</button>
          </>
        )}
      />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Receita da rede', v: 'R$ ' + totalRev.toLocaleString('pt-BR'), s: '+12,4% vs período anterior', tone: 'up' },
            { l: 'Itens em estoque', v: '83.670', s: 'R$ 4,82 M a custo' },
            { l: 'Margem consolidada', v: '41,2%', s: 'meta da rede: 45%', tone: 'down' },
            { l: 'SKUs em ruptura', v: '39', s: 'em 3 unidades', tone: 'down' },
            { l: 'Estoque desbalanceado', v: '128', s: 'SKUs com sobra e falta', tone: 'down' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10.5, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Desempenho por unidade</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
              Cobertura = dias de estoque no ritmo de venda da própria unidade.
            </p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Unidade</th><th>Tipo</th>
                <th style={{ width: '17%' }}>Receita</th><th className="num">vs. meta</th>
                <th className="num">Unid. vendidas</th><th className="num">Margem</th>
                <th className="num">Cobertura</th><th className="num">Ruptura</th><th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {NET_UNITS.map((u, i) => {
                const vsTarget = ((u.revenue / u.target) - 1) * 100;
                return (
                  <tr key={u.name} style={{ background: i === 0 ? 'var(--accent-soft)' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <StoreAvatar name={u.name} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {u.name}
                            {i === 0 && <span className="badge badge-accent">atual</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                            {u.skus.toLocaleString('pt-BR')} SKUs · {u.items.toLocaleString('pt-BR')} itens
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge">{u.type}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                          <div style={{ width: `${(u.revenue / maxRev) * 100}%`, height: '100%', background: i === 0 ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 62, textAlign: 'right' }}>
                          R$ {(u.revenue / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: vsTarget >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {vsTarget >= 0 ? '+' : ''}{vsTarget.toFixed(1)}%
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.units.toLocaleString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: u.margin >= 42 ? 'var(--success)' : 'var(--fg-muted)' }}>{u.margin}%</td>
                    <td className="num">
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: u.cover < 30 ? 'var(--warning)' : u.cover > 60 ? 'var(--info)' : 'var(--fg)',
                      }}>{u.cover}d</span>
                    </td>
                    <td className="num">
                      {u.rupture > 10
                        ? <span className="badge badge-warning">{u.rupture}</span>
                        : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{u.rupture}</span>}
                    </td>
                    <td><button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">Abrir</button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-sunken)', fontWeight: 500 }}>
                <td colSpan={2} style={{ fontSize: 12, padding: '10px 12px', borderTop: '1px solid var(--line)' }}>Rede</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>
                  R$ {(totalRev / 1000).toFixed(0)}k
                </td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', borderTop: '1px solid var(--line)', padding: '10px 12px' }}>+3,2%</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>4.286</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>41,2%</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>46d</td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderTop: '1px solid var(--line)', padding: '10px 12px' }}>39</td>
                <td style={{ borderTop: '1px solid var(--line)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Estoque desbalanceado</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Mesmo SKU faltando numa unidade e sobrando em outra. Transferir sai mais barato e mais rápido que comprar.
              </p>
            </div>
            <button onClick={() => navigate('/stock/transfer')} className="btn btn-primary btn-sm"><I.Swap size={12} /> Sugerir transferências</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                {NET_UNITS.map(u => <th key={u.name} className="num">{u.name.replace('Loja ', '').replace('Centro de Distribuição', 'CD')}</th>)}
                <th>Diagnóstico</th><th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {imbalance.map(r => {
                const low = r.rows.findIndex((q, i) => q <= 3 && r.sold[i] > 10);
                const high = r.rows.indexOf(Math.max(...r.rows));
                return (
                  <tr key={r.sku}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductThumb cat={r.cat} attrs={r.attrs} size={26} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{variantLabel(r.attrs)}</div>
                        </div>
                      </div>
                    </td>
                    {r.rows.map((q, i) => (
                      <td key={i} className="num">
                        <span style={{
                          display: 'inline-block', minWidth: 34, textAlign: 'center',
                          padding: '2px 7px', borderRadius: 4,
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                          background: i === low ? 'var(--danger-soft)' : i === high ? 'var(--info-soft)' : 'transparent',
                          color: i === low ? 'var(--danger)' : i === high ? 'var(--info)' : 'var(--fg-muted)',
                        }}>{q}</span>
                      </td>
                    ))}
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                      Falta em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{NET_UNITS[low].name.replace('Loja ', '')}</strong>,
                      parado no <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{NET_UNITS[high].name.replace('Centro de Distribuição', 'CD')}</strong>
                    </td>
                    <td>
                      <button onClick={() => navigate('/stock/transfer')} className="btn btn-outline btn-sm">Transferir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Receita consolidada por dia</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Soma das 4 unidades.</p>
              </div>
              <button onClick={() => navigate('/reports/sales')} className="btn btn-ghost btn-sm">Relatório <I.ChevronRight size={12} /></button>
            </div>
            <MiniAreaChart data={MOCK.salesSeries} height={180} />
          </div>

          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Participação na receita</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--fg-muted)' }}>Loja Centro concentra 41% do faturamento.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <DonutChart size={132} thickness={20}
                segments={NET_UNITS.map((u, i) => ({ value: u.revenue, color: i === 0 ? 'var(--accent)' : ['#1D4FD7', '#7C3AED', '#0F766E'][i - 1] }))}
                center={(
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>413k</div>
                    <div style={{ fontSize: 9.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>rede</div>
                  </div>
                )} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {NET_UNITS.map((u, i) => (
                  <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: i === 0 ? 'var(--accent)' : ['#1D4FD7', '#7C3AED', '#0F766E'][i - 1], flexShrink: 0 }}></span>
                    <span style={{ fontSize: 12, flex: 1 }}>{u.name.replace('Centro de Distribuição', 'CD')}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{((u.revenue / totalRev) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /reports/abc — ABC curve ===
